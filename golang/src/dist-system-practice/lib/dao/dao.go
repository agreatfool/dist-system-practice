package dao

import (
	"dist-system-practice/lib/cache"
	"dist-system-practice/lib/database"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/model"
	"dist-system-practice/lib/random"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
	"github.com/jinzhu/gorm"
	"go.uber.org/zap"
	"time"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Global
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

var instance *Dao

const defaultWorkExpiration = 7 * 24 * 60 * 60 // 7 days

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Structure
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

type Dao struct {
	db     *gorm.DB
	cache  *memcache.Client
	logger *zap.Logger
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Factory
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func Get() *Dao {
	return instance
}

func New() *Dao {
	if instance != nil {
		return instance
	}

	instance = &Dao{
		db:     database.Get(),
		cache:  cache.Get(),
		logger: logger.Get(),
	}

	return instance
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Errors
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

var ErrNoRecordUpdated = errors.New("no record updated")

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Apis
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func (d *Dao) GetWork(id uint32) (*model.Work, error) {
	var work model.Work

	// build cache key
	key := d.fmtWorkCacheKey(id)

	// search cache
	cached, cacheErr := d.cache.Get(key)
	if cacheErr != nil && cacheErr != memcache.ErrCacheMiss {
		d.logger.Error("[Dao] GetWork: Cache get error.",
			zap.String("api", "GetWork"), zap.Uint32("workId", id), zap.Error(cacheErr))
		return &work, cacheErr
	}

	if cacheErr == memcache.ErrCacheMiss {

		// no cached value found, query database
		err := d.db.Where("id = ?", id).First(&work).Error

		if err != nil { // maybe gorm.ErrRecordNotFound
			if err == gorm.ErrRecordNotFound {
				d.logger.Warn("[Dao] GetWork: Work not found in db.",
					zap.String("api", "GetWork"), zap.Uint32("workId", id))
			} else {
				d.logger.Error("[Dao] GetWork: Error in db.",
					zap.String("api", "GetWork"), zap.Uint32("workId", id), zap.Error(err))
			}

			return &work, err
		} else {
			// found in database, set cache
			err := d.cacheWork(work)
			if err != nil {
				d.logger.Error("[Dao] GetWork: Cache set error.",
					zap.String("api", "GetWork"), zap.Uint32("workId", id), zap.Error(err))
				return &work, err
			}
			return &work, nil
		}

	} else {

		// decode from cached value
		if err := d.decodeWork(cached.Value, &work); err != nil {
			d.logger.Error("[Dao] GetWork: Work decode error.",
				zap.String("api", "GetWork"), zap.Uint32("workId", id), zap.Error(err))
			return &work, err
		}
		return &work, nil

	}
}

func (d *Dao) UpdateViewed(id uint32) (uint32, error) {
	var work model.Work

	// build cache key
	key := d.fmtWorkCacheKey(id)

	dbRes := d.db.Model(&work).Where("id = ?", id).UpdateColumn("viewed", gorm.Expr("viewed + 1"))
	if dbRes.Error != nil {
		// error in db
		d.logger.Error("[Dao] UpdateViewed: Error in db.",
			zap.String("api", "UpdateViewed"), zap.Uint32("workId", id), zap.Error(dbRes.Error))
		return 0, dbRes.Error
	}
	if dbRes.RowsAffected == 0 {
		// no record updated, invalid
		d.logger.Error("[Dao] UpdateViewed: No record updated.",
			zap.String("api", "UpdateViewed"), zap.Uint32("workId", id), zap.Error(ErrNoRecordUpdated))
		return 0, ErrNoRecordUpdated
	}

	// invalidate cache
	if err := d.cache.Delete(key); err != nil && err != memcache.ErrCacheMiss {
		d.logger.Error("[Dao] UpdateViewed: Cache delete error.",
			zap.String("api", "UpdateViewed"), zap.Uint32("workId", id), zap.Error(err))
		return 0, err
	}

	// get updated work record
	read, getErr := d.GetWork(id)
	if getErr != nil {
		return 0, getErr
	}

	return read.Viewed, nil
}

func (d *Dao) PlanWork(id uint32) (*model.Work, error) {
	var work model.Work

	// build cache key
	key := d.fmtWorkCacheKey(id)

	// isPlanned plannedAt
	dbRes := d.db.Model(&work).Where("id = ?", id).
		UpdateColumns(model.Work{IsPlanned: true, PlannedAt: time.Now()})
	if dbRes.Error != nil {
		// error in db
		d.logger.Error("[Dao] PlanWork: Error in db.",
			zap.String("api", "PlanWork"), zap.Uint32("workId", id), zap.Error(dbRes.Error))
		return &work, dbRes.Error
	}
	if dbRes.RowsAffected == 0 {
		// no record updated, invalid
		d.logger.Error("[Dao] PlanWork: No record updated.",
			zap.String("api", "PlanWork"), zap.Uint32("workId", id), zap.Error(ErrNoRecordUpdated))
		return &work, ErrNoRecordUpdated
	}

	// invalidate cache
	if err := d.cache.Delete(key); err != nil && err != memcache.ErrCacheMiss {
		d.logger.Error("[Dao] PlanWork: Cache delete error.",
			zap.String("api", "PlanWork"), zap.Uint32("workId", id), zap.Error(err))
		return &work, err
	}

	// get updated work record
	read, getErr := d.GetWork(id)
	if getErr != nil {
		return &work, getErr
	}

	return read, nil
}

func (d *Dao) FinishPlannedWork(id uint32, achievement string) error {
	var work model.Work

	// build cache key
	key := d.fmtWorkCacheKey(id)

	// db update
	dbRes := d.db.Model(&work).Where("id = ?", id).
		Updates(map[string]interface{}{
			"achieved_count": gorm.Expr("achieved_count + 1"),
			"achievement":    achievement,
			"is_planned":     false,
			"achieved_at":    time.Now(),
		})
	if dbRes.Error != nil {
		// error in db
		d.logger.Error("[Dao] FinishPlannedWork: Error in db.",
			zap.String("api", "FinishPlannedWork"), zap.Uint32("workId", id), zap.Error(dbRes.Error))
		return dbRes.Error
	}
	if dbRes.RowsAffected == 0 {
		// no record updated, invalid
		d.logger.Error("[Dao] FinishPlannedWork: No record updated.",
			zap.String("api", "FinishPlannedWork"), zap.Uint32("workId", id), zap.Error(ErrNoRecordUpdated))
		return ErrNoRecordUpdated
	}

	// invalidate cache
	if err := d.cache.Delete(key); err != nil && err != memcache.ErrCacheMiss {
		d.logger.Error("[Dao] FinishPlannedWork: Cache delete error.",
			zap.String("api", "FinishPlannedWork"), zap.Uint32("workId", id), zap.Error(err))
		return err
	}

	return nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Cache
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func (d *Dao) cacheWork(work model.Work) error {
	item := memcache.Item{}

	// set key
	item.Key = d.fmtWorkCacheKey(work.Id)

	// set value
	value, encodeErr := d.encodeWork(work)
	if encodeErr != nil {
		return encodeErr
	}
	item.Value = value

	// set expiration
	item.Expiration = d.buildWorkExpireTime()

	// set cache
	err := d.cache.Set(&item)
	if err != nil {
		return err
	}
	return nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Encoders & Decoders
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func (d *Dao) encodeWork(work model.Work) ([]byte, error) {
	value, err := json.Marshal(work)
	if err != nil {
		return nil, err
	} else {
		return value, nil
	}
}

func (d *Dao) decodeWork(value []byte, work *model.Work) error {
	if err := json.Unmarshal(value, &work); err != nil {
		return err
	}
	return nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Tools
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func (d *Dao) fmtWorkCacheKey(id uint32) string {
	return fmt.Sprintf("work%08d", id)
}

func (d *Dao) buildWorkExpireTime() int32 {
	alter := int32(defaultWorkExpiration * (1 + random.Float(0.0, 0.1)))

	return int32(time.Now().Local().Add(time.Second * time.Duration(alter)).Unix())
}
