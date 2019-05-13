package database

import (
	"dist-system-practice/lib/common"
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"time"
)

var instance *gorm.DB

type Config struct {
	Host            string `json:"host" yaml:"host"`
	Port            int    `json:"port" yaml:"port"`
	User            string `json:"user" yaml:"user"`
	Password        string `json:"password" yaml:"password"`
	Database        string `json:"database" yaml:"database"`
	Charset         string `json:"charset" yaml:"charset"`
	Collation       string `json:"collation" yaml:"collation"`
	MaxOpenConn     int    `json:"maxOpenConn" yaml:"maxOpenConn"`
	MaxIdleConn     int    `json:"maxIdleConn" yaml:"maxIdleConn"`
	ConnMaxLifetime int    `json:"connMaxLifetime" yaml:"connMaxLifetime"`
}

func Get() *gorm.DB {
	return instance
}

func New() *gorm.DB {
	config := Config{}

	// get config path string
	confPath := common.GetEnv("MYSQL_CONF_PATH", "")
	if confPath == "" {
		panic("[Database] No conf path provided: MYSQL_CONF_PATH")
	}

	// read config into string
	conf, ioErr := ioutil.ReadFile(confPath)
	if ioErr != nil {
		panic(fmt.Sprintf("[Database] Failed to read conf file: %s", ioErr.Error()))
	}

	// parse config yaml
	if err := yaml.Unmarshal(conf, &config); err != nil {
		panic(fmt.Sprintf("[Database] Failed to parse yaml: %s", err.Error()))
	}

	// open database connection
	db, dbErr := gorm.Open("mysql",
		fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&collation=%s&&parseTime=true&loc=Local",
			config.User, config.Password, config.Host, config.Port, config.Database,
			config.Charset, config.Collation))
	if dbErr != nil {
		panic(fmt.Sprintf("[Database] Failed to connect to mysql: %s", dbErr.Error()))
	}

	instance = db

	instance.DB().SetMaxOpenConns(config.MaxOpenConn)
	instance.DB().SetMaxIdleConns(config.MaxIdleConn)
	instance.DB().SetConnMaxLifetime(time.Second * time.Duration(config.ConnMaxLifetime))

	return instance
}
