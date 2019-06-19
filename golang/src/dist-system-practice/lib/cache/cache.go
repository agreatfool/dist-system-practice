package cache

import (
	"dist-system-practice/lib/common"
	"encoding/json"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
)

var instance *memcache.Client

type Config struct {
	// Servers is a list of address: "127.0.0.1:11211".
	Servers []string `json:"servers" yaml:"servers"`
}

// Get Cache instance.
func Get() *memcache.Client {
	return instance
}

// Initialize Cache instance.
func New() *memcache.Client {
	if instance != nil {
		return instance
	}

	config := Config{}

	// get config
	conf := common.GetEnv("CACHE_SERVERS", "")
	if conf == "" {
		panic("[Cache] No conf provided: CACHE_SERVERS")
	}
	conf = fmt.Sprintf("{\"servers\":%s}", conf)

	// parse config json
	if err := json.Unmarshal([]byte(conf), &config); err != nil {
		panic(fmt.Sprintf("[Cache] Failed to parse json: %s", err.Error()))
	}

	// loop & confirm servers available
	for _, server := range config.Servers {
		conn := memcache.New(server)
		_, err := conn.Get("%$^#@@$") // dummy key
		if err != memcache.ErrCacheMiss {
			panic(fmt.Sprintf("[Cache] Failed to connect to server: %s, err: %v", server, err))
		}
	}

	// init memcached client
	instance = memcache.New(config.Servers...)

	return instance
}
