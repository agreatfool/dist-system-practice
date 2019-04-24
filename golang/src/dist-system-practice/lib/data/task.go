package data

import "time"

type Task struct {
	userId       int
	taskId       string
	planedTime   time.Time
	finishedTime time.Time
}
