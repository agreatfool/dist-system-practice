package kafka

import "github.com/segmentio/kafka-go"

var reader *kafka.Reader
var writer *kafka.Writer

func GetReader() *kafka.Reader {
	return reader
}

func NewReader(brokers []string, partition int) *kafka.Reader {
	if reader != nil {
		return reader
	}

	reader = kafka.NewReader(kafka.ReaderConfig{
		Brokers:   brokers,
		Topic:     "work-topic",
		Partition: partition,
		MinBytes:  0,
		MaxBytes:  1024 * 1024, // 1M
	})

	return reader
}

func GetWriter() *kafka.Writer {
	return writer
}

func NewWriter(brokers []string) *kafka.Writer {
	if writer != nil {
		return writer
	}

	writer = kafka.NewWriter(kafka.WriterConfig{
		Brokers:  brokers,
		Topic:    "work-topic",
		Balancer: &kafka.LeastBytes{},
	})

	return writer
}
