package cache

import (
	"github.com/bradfitz/gomemcache/memcache"
)

type Cache struct {
	client memcache.Client
}

func New() *Cache {

	return nil
}
