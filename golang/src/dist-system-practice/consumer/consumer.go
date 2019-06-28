package main

import (
	"dist-system-practice/lib/cache"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/dao"
	"dist-system-practice/lib/database"
	"dist-system-practice/lib/jaeger"
	lkafka "dist-system-practice/lib/kafka"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/timerecorder"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
	"github.com/gorilla/mux"
	"github.com/opentracing/opentracing-go"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/satori/go.uuid"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"golang.org/x/net/context"
	"net/http"
	_ "net/http/pprof"
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
	jaeger.New()

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

	go httpEntrance()

	// wait
	select {}
}

func httpEntrance() {
	host := common.GetEnv("WEB_HOST", "0.0.0.0")
	port := common.GetEnv("WEB_PORT", "8002")

	router := mux.NewRouter()
	router.PathPrefix("/debug/pprof/").Handler(http.DefaultServeMux)
	router.Handle("/metrics", promhttp.Handler())

	http.Handle("/", router)

	if err := http.ListenAndServe(fmt.Sprintf("%s:%s", host, port), nil); err != nil {
		fmt.Println(err)
	}
}

func consume(reader *kafka.Reader) {
	var msg kafka.Message
	var err error
	var span opentracing.Span
	var ctx = context.Background()
	var recorder *timerecorder.TimeRecorder

	ctx, span = jaeger.NewConsumerSpan(ctx, "Kafka.Consumer")
	defer func() {
		log("Done", msg, recorder, err)
		jaeger.FinishConsumerSpan(span, err)
	}()

	// fetch message
	msg, err = reader.FetchMessage(ctx)
	if err != nil {
		return
	} else {
		log("Got message", msg, recorder, err)
	}
	recorder = timerecorder.New()
	// reset span, since "reader.FetchMessage(ctx)" blocks the routine,
	// time consumption of previous span is invalid
	ctx, span = jaeger.NewConsumerSpan(ctx, "Kafka.Consumer")
	span.SetBaggageItem("partition", common.IntToStr(msg.Partition))
	span.SetBaggageItem("offset", common.Int64ToStr(msg.Offset))
	span.SetBaggageItem("workId", string(msg.Value))

	// get workId from message
	var mvInt int
	mvInt, err = common.StrToInt(string(msg.Value))
	if err != nil {
		return
	}
	workId := uint32(mvInt)

	// calc achievement
	achievement := calc(ctx, workId)

	// update db
	if err = dao.Get().FinishPlannedWork(ctx, workId, achievement); err != nil {
		return
	}

	// commit message
	if err = reader.CommitMessages(ctx, msg); err != nil {
		return
	}
}

func calc(ctx context.Context, workId uint32) string {
	var span opentracing.Span
	ctx, span = jaeger.NewCalcSpan(ctx, "Kafka.Consumer.Calc")
	span.SetBaggageItem("factor", common.IntToStr(factor))
	defer jaeger.FinishCalcSpan(span)

	return fmt.Sprintf("work.%d.%d;%s", workId, common.Consume(factor), uuid.NewV4())
}

func log(info string, msg kafka.Message, recorder *timerecorder.TimeRecorder, err error) {
	if err != nil && err != memcache.ErrCacheMiss {
		logger.Get().Error(fmt.Sprintf("[Consumer] Error: %s", err.Error()), zap.Error(err))
		return
	}

	fields := []zap.Field{
		zap.String("topic", msg.Topic),
		zap.Int("partition", msg.Partition),
		zap.Int64("offset", msg.Offset),
		zap.String("value", string(msg.Value)),
		zap.Time("time", msg.Time),
	}

	if info == "Done" {
		recorder.End()
		fields = append(fields, zap.Float64("consumed", recorder.Elapsed()))
	}

	logger.Get().Info(fmt.Sprintf("[Consumer] %s.", info), fields...)
}
