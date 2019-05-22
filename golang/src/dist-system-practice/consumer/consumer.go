package main

import (
	"dist-system-practice/lib/cache"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/dao"
	"dist-system-practice/lib/database"
	lkafka "dist-system-practice/lib/kafka"
	"dist-system-practice/lib/logger"
	"fmt"
	"github.com/satori/go.uuid"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"golang.org/x/net/context"
	"os"
)

var factor = 37
var readers []*kafka.Reader

func main() {
	// ensure env
	// APP_NAME shall be ensured before logger initialized
	if common.GetEnv("APP_NAME", "") == "" {
		if err := os.Setenv("APP_NAME", "Consumer"); err != nil {
			panic(fmt.Sprintf("[Consumer] Failed to set env APP_NAME: %s", err.Error()))
		}
	}
	// CONSUMER_FACTOR
	var cErr error
	envFactor := common.GetEnv("CONSUMER_FACTOR", "37")
	factor, cErr = common.StrToInt(envFactor)
	if cErr != nil {
		panic(fmt.Sprintf("[Consumer] Invalid CONSUMER_FACTOR: %s", envFactor))
	}
	// CONSUMER_ROUTINES
	envCount := common.GetEnv("CONSUMER_ROUTINES", "1")
	routineCount, err := common.StrToInt(envCount)
	if err != nil {
		panic(fmt.Sprintf("[Consumer] Invalid CONSUMER_ROUTINES: %s", envCount))
	}

	// initialize utilities
	logger.New()
	cache.New()
	database.New()
	dao.New()

	// create kafka reader connections
	readers = make([]*kafka.Reader, routineCount)
	for i := 0; i < routineCount; i++ {
		readers[i] = lkafka.NewReader()
	}

	// consume messages
	for i := 0; i < routineCount; i++ {
		go func(readerId int) {
			for {
				consume(readers[readerId])
			}
		}(i)
	}

	// wait
	select {}
}

func consume(reader *kafka.Reader) {
	// fetch message
	msg, rErr := reader.FetchMessage(context.Background())
	if rErr != nil {
		logger.Get().Error("[Consumer] consume: Read message error.", zap.Error(rErr))
		return
	} else {
		logger.Get().Info("[Consumer] consume: Got message.",
			zap.String("topic", msg.Topic),
			zap.Int("partition", msg.Partition),
			zap.Int64("offset", msg.Offset),
			zap.String("value", string(msg.Value)),
			zap.Time("time", msg.Time))
	}

	// get workId from message
	mvInt, cErr := common.StrToInt(string(msg.Value))
	if cErr != nil {
		logger.Get().Error("[Consumer] consume: Convert message value error.", zap.Error(cErr))
		return
	}
	workId := uint32(mvInt)

	// calc achievement
	achievement := fmt.Sprintf("work.%d.%d;%s", workId, common.Consume(factor), uuid.NewV4())

	// update db
	if err := dao.Get().FinishPlannedWork(workId, achievement); err != nil {
		logger.Get().Error("[Consumer] consume: Convert message value error.", zap.Error(err))
		return
	}

	// commit message
	if err := reader.CommitMessages(context.Background(), msg); err != nil {
		logger.Get().Error("[Consumer] consume: Commit message error.", zap.Error(err))
	} else {
		logger.Get().Info("[Consumer] consume: Done.",
			zap.String("topic", msg.Topic),
			zap.Int("partition", msg.Partition),
			zap.Int64("offset", msg.Offset),
			zap.String("value", string(msg.Value)),
			zap.Time("time", msg.Time))
	}
}
