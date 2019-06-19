package database

import (
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/logger"
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	"github.com/wantedly/gorm-zap"
	"time"
)

var instance *gorm.DB
var address string

func Get() *gorm.DB {
	return instance
}

func New() *gorm.DB {
	if instance != nil {
		return instance
	}

	var err error

	// get config
	dbHost := common.GetEnv("DB_HOST", "")
	if dbHost == "" {
		panic("[Database] No conf provided: DB_HOST")
	}
	var dbPort int
	dbPortConf := common.GetEnv("DB_PORT", "")
	if dbPortConf == "" {
		panic("[Database] No conf provided: DB_PORT")
	}
	if dbPort, err = common.StrToInt(dbPortConf); err != nil {
		panic(fmt.Sprintf("[Database] Err in converting DB_PORT: %s", err.Error()))
	}
	dbUser := common.GetEnv("DB_USER", "")
	if dbUser == "" {
		panic("[Database] No conf provided: DB_USER")
	}
	dbPwd := common.GetEnv("DB_PWD", "")
	if dbPwd == "" {
		panic("[Database] No conf provided: DB_PWD")
	}
	dbName := common.GetEnv("DB_NAME", "")
	if dbName == "" {
		panic("[Database] No conf provided: DB_NAME")
	}
	dbCharset := common.GetEnv("DB_CHARSET", "")
	if dbCharset == "" {
		panic("[Database] No conf provided: DB_CHARSET")
	}
	dbCollation := common.GetEnv("DB_COLLATION", "")
	if dbCollation == "" {
		panic("[Database] No conf provided: DB_COLLATION")
	}
	var dbMaxOpenConn int
	dbMaxOpenConnConf := common.GetEnv("DB_MAX_OPEN_CONN", "")
	if dbMaxOpenConnConf == "" {
		panic("[Database] No conf provided: DB_MAX_OPEN_CONN")
	}
	if dbMaxOpenConn, err = common.StrToInt(dbMaxOpenConnConf); err != nil {
		panic(fmt.Sprintf("[Database] Err in converting DB_MAX_OPEN_CONN: %s", err.Error()))
	}
	var dbMaxIdleConn int
	dbMaxIdleConnConf := common.GetEnv("DB_MAX_IDLE_CONN", "")
	if dbMaxIdleConnConf == "" {
		panic("[Database] No conf provided: DB_MAX_IDLE_CONN")
	}
	if dbMaxIdleConn, err = common.StrToInt(dbMaxIdleConnConf); err != nil {
		panic(fmt.Sprintf("[Database] Err in converting DB_MAX_IDLE_CONN: %s", err.Error()))
	}
	var dbConnMaxLifeTime int
	dbConnMaxLifeTimeConf := common.GetEnv("DB_CONN_MAX_LIFE_TIME", "")
	if dbConnMaxLifeTimeConf == "" {
		panic("[Database] No conf provided: DB_CONN_MAX_LIFE_TIME")
	}
	if dbConnMaxLifeTime, err = common.StrToInt(dbConnMaxLifeTimeConf); err != nil {
		panic(fmt.Sprintf("[Database] Err in converting DB_CONN_MAX_LIFE_TIME: %s", err.Error()))
	}

	// make DSN (Data Source Name)
	address = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&collation=%s&parseTime=true&loc=Local",
		dbUser, dbPwd, dbHost, dbPort, dbName,
		dbCharset, dbCollation)

	// open database connection
	db, dbErr := gorm.Open("mysql", address)
	if dbErr != nil {
		panic(fmt.Sprintf("[Database] Failed to connect to mysql: %s", dbErr.Error()))
	}

	db.DB().SetMaxOpenConns(dbMaxOpenConn)
	db.DB().SetMaxIdleConns(dbMaxIdleConn)
	db.DB().SetConnMaxLifetime(time.Second * time.Duration(dbConnMaxLifeTime))

	db.LogMode(true)
	db.SetLogger(gormzap.New(logger.New()))

	instance = db

	return instance
}

func Address() string {
	return address
}
