package cache

import (
	"dist-system-practice/lib/common"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
	"gopkg.in/yaml.v2"
	"io/ioutil"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Global
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

var instance *Cache

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Types
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

type Config struct {
	// Servers is a list of address: "127.0.0.1:11211".
	Servers []string `json:"servers" yaml:"servers"`
}

type Cache struct {
	Client *memcache.Client
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Instance
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

// Get Cache instance.
func Get() *Cache {
	return instance
}

// Initialize Cache instance.
func New() *Cache {
	config := Config{}

	// get config path string
	confPath := common.GetEnv("CACHE_CONF_PATH", "")
	if confPath == "" {
		panic("[Cache] No conf path provided: CACHE_CONF_PATH")
	}

	// read config into string
	conf, ioErr := ioutil.ReadFile(confPath)
	if ioErr != nil {
		panic(fmt.Sprintf("[Cache] Failed to read conf file: %s", ioErr.Error()))
	}

	// parse config yaml
	if err := yaml.Unmarshal(conf, &config); err != nil {
		panic(fmt.Sprintf("[Cache] Failed to parse yaml: %s", err.Error()))
	}

	// init memcached client
	mc := memcache.New(config.Servers...)
	instance = &Cache{
		Client: mc,
	}

	return instance
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Api
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func (c *Cache) GetItem() {

}
