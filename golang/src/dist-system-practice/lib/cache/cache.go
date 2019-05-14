package cache

import (
	"dist-system-practice/lib/common"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
	"gopkg.in/yaml.v2"
	"io/ioutil"
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
