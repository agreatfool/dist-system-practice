package data

import "time"

type User struct {
	id           int
	name         string
	age          int
	task         Task
	consumedTime time.Time
}
