package model

import (
	"time"
)

type Work struct {
	Id            uint32    `json:"id" yaml:"id" gorm:"AUTO_INCREMENT;primary_key"`
	Viewed        uint32    `json:"viewed" yaml:"viewed" gorm:"default:0"`
	AchievedCount uint32    `json:"achievedCount" yaml:"achievedCount" gorm:"default:0"`
	Achievement   string    `json:"achievement" yaml:"achievement" gorm:"default:'';size:256"`
	IsPlanned     bool      `json:"isPlanned" yaml:"isPlanned" gorm:"default:false"`
	PlannedAt     time.Time `json:"plannedAt" yaml:"plannedAt" gorm:"default:CURRENT_TIMESTAMP"`
	AchievedAt    time.Time `json:"achievedAt" yaml:"achievedAt" gorm:"default:CURRENT_TIMESTAMP"`
	Created       time.Time `json:"created" yaml:"created" gorm:"default:CURRENT_TIMESTAMP"`
	Updated       time.Time `json:"updated" yaml:"updated" gorm:"default:CURRENT_TIMESTAMP"`
}

func (Work) TableName() string {
	return "work"
}
