package model

import (
	"time"
)

type Work struct {
	Id          uint32    `json:"id" yaml:"id" gorm:"AUTO_INCREMENT"`
	Viewed      uint32    `json:"viewed" yaml:"viewed" gorm:"default:0"`
	Achievement string    `json:"achievement" yaml:"achievement" gorm:"default:''"`
	IsPlanned   bool      `json:"isPlanned" yaml:"isPlanned" gorm:"default:false"`
	Created     time.Time `json:"created" yaml:"created" gorm:"default:CURRENT_TIMESTAMP"`
	Updated     time.Time `json:"updated" yaml:"updated" gorm:"default:CURRENT_TIMESTAMP"`
}

func (Work) TableName() string {
	return "work"
}
