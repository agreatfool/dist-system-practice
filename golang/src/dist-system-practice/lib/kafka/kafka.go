package kafka

import (
	"dist-system-practice/lib/common"
	"encoding/json"
	"fmt"
	"github.com/segmentio/kafka-go"
	"strconv"
	"time"
)

var writer *kafka.Writer

type Config struct {
	// Servers is a list of address: "127.0.0.1:11211".
	Servers []string `json:"servers" yaml:"servers"`
}

func NewReader() *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:        getBrokers(),
		GroupID:        "work-group",
		Topic:          "work-topic",
		MinBytes:       0,
		MaxBytes:       1024 * 1024, // 1M
		CommitInterval: time.Second, // flushes commits to Kafka every second
	})
}

func GetWriter() *kafka.Writer {
	return writer
}

func NewWriter() *kafka.Writer {
	if writer != nil {
		return writer
	}

	writer = kafka.NewWriter(kafka.WriterConfig{
		Brokers:      getBrokers(),
		Topic:        "work-topic",
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: 1,            // 1: leader received | 0: no ack at all | -1: all received
		Async:        writeAsync(), // async/sync writing
	})

	return writer
}

func getBrokers() []string {
	config := Config{}

	// get config path string
	conf := common.GetEnv("KAFKA_BROKERS", "")
	if conf == "" {
		panic("[Kafka] No conf provided: KAFKA_BROKERS")
	}
	conf = fmt.Sprintf("{\"servers\":%s}", conf)

	// parse config json
	if err := json.Unmarshal([]byte(conf), &config); err != nil {
		panic(fmt.Sprintf("[Kafka] Failed to parse json: %s", err.Error()))
	}

	return config.Servers
}

func writeAsync() bool {
	e := common.GetEnv("KAFKA_WRITE_ASYNC", "")

	if e == "" {
		return false
	} else {
		b, err := strconv.ParseBool(e)
		if err != nil {
			return false
		}
		return b
	}
}
