package dao

import (
	"context"
	"dist-system-practice/lib/cache"
	"dist-system-practice/lib/database"
	"dist-system-practice/lib/jaeger"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/model"
	"dist-system-practice/lib/random"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
	"github.com/jinzhu/gorm"
	"github.com/opentracing/opentracing-go"
	"go.uber.org/zap"
	"time"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Global
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

var instance *Dao

const timeout = 10
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

func (d *Dao) GetWork(ctx context.Context, id uint32) (*model.Work, error) {
	var work model.Work
	var span opentracing.Span
	var err error

	ctx, span = jaeger.NewDbSpanFromContext(ctx, "Dao.GetWork")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		d.logError("GetWork", id, err)
		jaeger.FinishDbSpan(span, err)
	}()

	// build cache key
	key := d.fmtWorkCacheKey(id)

	// search cache
	var cached *memcache.Item
	cached, err = d.cache.Get(key)
	if err != nil && err != memcache.ErrCacheMiss {
		return &work, err
	}

	if err == memcache.ErrCacheMiss {

		// reset err
		err = nil

		// no cached value found, query database
		err = d.db.Where("id = ?", id).First(&work).Error

		if err != nil { // maybe gorm.ErrRecordNotFound
			return &work, err
		} else {
			// found in database, set cache
			err = d.cacheWork(work)
			if err != nil {
				return &work, err
			}
			return &work, nil
		}

	} else {

		// decode from cached value
		if err = d.decodeWork(cached.Value, &work); err != nil {
			return &work, err
		}
		return &work, nil

	}
}

func (d *Dao) UpdateViewed(ctx context.Context, id uint32) (uint32, error) {
	var work model.Work
	var span opentracing.Span
	var err error

	ctx, span = jaeger.NewDbSpanFromContext(ctx, "Dao.UpdateViewed")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		d.logError("UpdateViewed", id, err)
		jaeger.FinishDbSpan(span, err)
	}()

	// build cache key
	key := d.fmtWorkCacheKey(id)

	dbRes := d.db.Model(&work).Where("id = ?", id).UpdateColumn("viewed", gorm.Expr("viewed + 1"))
	if dbRes.Error != nil { // error in db
		err = dbRes.Error
		return 0, err
	}
	if dbRes.RowsAffected == 0 { // no record updated, invalid
		err = ErrNoRecordUpdated
		return 0, err
	}

	// invalidate cache
	if err = d.cache.Delete(key); err != nil && err != memcache.ErrCacheMiss {
		return 0, err
	}

	// get updated work record
	var got *model.Work
	got, err = d.GetWork(ctx, id)
	if err != nil {
		return 0, err
	}

	return got.Viewed, nil
}

func (d *Dao) PlanWork(ctx context.Context, id uint32) (*model.Work, error) {
	var work model.Work
	var span opentracing.Span
	var err error

	ctx, span = jaeger.NewDbSpanFromContext(ctx, "Dao.PlanWork")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		d.logError("PlanWork", id, err)
		jaeger.FinishDbSpan(span, err)
	}()

	// build cache key
	key := d.fmtWorkCacheKey(id)

	// isPlanned plannedAt
	dbRes := d.db.Model(&work).Where("id = ?", id).
		UpdateColumns(model.Work{IsPlanned: true, PlannedAt: time.Now()})
	if dbRes.Error != nil { // error in db
		err = dbRes.Error
		return &work, err
	}
	if dbRes.RowsAffected == 0 { // no record updated, invalid
		err = ErrNoRecordUpdated
		return &work, err
	}

	// invalidate cache
	if err = d.cache.Delete(key); err != nil && err != memcache.ErrCacheMiss {
		return &work, err
	}

	// get updated work record
	var got *model.Work
	got, err = d.GetWork(ctx, id)
	if err != nil {
		return &work, err
	}

	return got, nil
}

func (d *Dao) FinishPlannedWork(ctx context.Context, id uint32, achievement string) error {
	var work model.Work
	var span opentracing.Span
	var err error

	ctx, span = jaeger.NewDbSpanFromContext(ctx, "Dao.FinishPlannedWork")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		d.logError("FinishPlannedWork", id, err)
		jaeger.FinishDbSpan(span, err)
	}()

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
	if dbRes.Error != nil { // error in db
		err = dbRes.Error
		return err
	}
	if dbRes.RowsAffected == 0 { // no record updated, invalid
		err = ErrNoRecordUpdated
		return err
	}

	// invalidate cache
	if err = d.cache.Delete(key); err != nil && err != memcache.ErrCacheMiss {
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

func (d *Dao) logError(api string, workId uint32, err error) {
	if err == nil || err == memcache.ErrCacheMiss {
		return
	}
	d.logger.Error(fmt.Sprintf("[Dao] %s: Error: %s", api, err.Error()),
		zap.String("api", api), zap.Uint32("workId", workId), zap.Error(err))
}
