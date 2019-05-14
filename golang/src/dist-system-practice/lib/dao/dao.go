package dao

import (
	"dist-system-practice/lib/cache"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/database"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/model"
	"encoding/json"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
	"github.com/jinzhu/gorm"
	"go.uber.org/zap"
	"time"
)

var instance *Dao

const defaultWorkExpiration = 7 * 24 * 60 * 60 // 7 days

type Dao struct {
	db     *gorm.DB
	cache  *memcache.Client
	logger *zap.Logger
}

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

func (d *Dao) GetWork(id uint32) (model.Work, error) {
	var work model.Work

	// build cache key
	key := d.fmtWorkCacheKey(id)

	// search cache
	cached, cacheErr := d.cache.Get(key)
	if cacheErr != nil && cacheErr != memcache.ErrCacheMiss {
		d.logger.Error("[Dao] GetWork: Cache get error.", zap.String("key", key), zap.Error(cacheErr))
		return work, cacheErr
	}

	if cacheErr == memcache.ErrCacheMiss {

		d.logger.Debug("[Dao] GetWork: Cache not found.", zap.Uint32("workId", id))

		// no cached value found, query database
		err := d.db.Where("id = ?", id).First(&work).Error

		if err != nil { // maybe gorm.ErrRecordNotFound
			if err == gorm.ErrRecordNotFound {
				d.logger.Info("[Dao] GetWork: Work not found in db.", zap.Uint32("workId", id))
			} else {
				d.logger.Error("[Dao] GetWork: Error in db.", zap.Uint32("workId", id), zap.Error(err))
			}

			return work, err
		} else {
			// found in database, set cache
			err := d.cacheWork(work)
			if err != nil {
				d.logger.Error("[Dao] GetWork: Cache set error.", zap.Error(err))
				return work, err
			}
			return work, nil
		}

	} else {

		// decode from cached value
		if err := d.decodeWork(cached.Value, &work); err != nil {
			d.logger.Error("[Dao] GetWork: Work decode error.", zap.Error(err))
			return work, err
		}
		return work, nil

	}
}

func (d *Dao) fmtWorkCacheKey(id uint32) string {
	return fmt.Sprintf("work%08d", id)
}

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

func (d *Dao) buildWorkExpireTime() int32 {
	alter := int32(defaultWorkExpiration * (1 + common.RandomFloat(0.0, 0.1)))

	return int32(time.Now().Local().Add(time.Second * time.Duration(alter)).Unix())
}
