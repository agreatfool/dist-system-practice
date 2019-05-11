package database

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type Dao struct {
	db *gorm.DB
}

func New() *Dao {

	return nil
}

