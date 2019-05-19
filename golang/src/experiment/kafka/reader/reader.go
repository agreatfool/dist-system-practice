package main

import (
	"context"
	"fmt"
	"github.com/segmentio/kafka-go"
	"log"
	"os"
	"time"
)

var mode string

func main() {
	var r1 *kafka.Reader
	var r2 *kafka.Reader
	var r3 *kafka.Reader

	brokers := []string{
		"127.0.0.1:19092",
		"127.0.0.1:29092",
		"127.0.0.1:39092",
	}

	mode = os.Getenv("MODE") // GROUP | NOGROUP, default is NOGROUP
	if len(mode) == 0 {
		log.Println("no env MODE provided, use default: GROUP")
		mode = "GROUP"
	} else if mode != "GROUP" && mode != "NOGROUP" {
		log.Printf("invalid env MODE: %s, use default: GROUP", mode)
		mode = "GROUP"
	}
	log.Printf("start to read with mode: %s", mode)

	switch mode {
	case "GROUP":
		r1 = newGroupReader(brokers)
		r2 = newGroupReader(brokers)
		r3 = newGroupReader(brokers)
	case "NOGROUP":
		r1 = newNoGroupReader(brokers, 0)
		r2 = newNoGroupReader(brokers, 1)
		r3 = newNoGroupReader(brokers, 2)
	default:
	}

	go func() {
		for {
			readOnce("r1", r1)
		}
	}()
	go func() {
		for {
			readOnce("r2", r2)
		}
	}()
	go func() {
		for {
			readOnce("r3", r3)
		}
	}()

	select {}
}

func readOnce(name string, r *kafka.Reader) {
	var m kafka.Message
	var err error

	switch mode {
	case "GROUP":
		m, err = r.FetchMessage(context.Background())
	case "NOGROUP":
		m, err = r.ReadMessage(context.Background())
	default:
		return
	}

	if err != nil {
		log.Fatalln(err.Error())
	}

	switch mode {
	case "GROUP":
		if err := r.CommitMessages(context.Background(), m); err != nil {
			log.Fatalln(err.Error())
		} else {
			fmt.Printf("[%s] message at topic/partition/offset %v/%v/%v: %s = %s\n",
				name, m.Topic, m.Partition, m.Offset, string(m.Key), string(m.Value))
		}
	case "NOGROUP":
		fmt.Printf("[%s] message at topic/partition/offset %v/%v/%v: %s = %s\n",
			name, m.Topic, m.Partition, m.Offset, string(m.Key), string(m.Value))
	default:
		return
	}
}

func newGroupReader(brokers []string) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:        brokers,
		GroupID:        "work-group",
		Topic:          "work-topic",
		MinBytes:       0,
		MaxBytes:       1024 * 1024, // 1M
		CommitInterval: time.Second, // flushes commits to Kafka every second
	})
}

func newNoGroupReader(brokers []string, partition int) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:   brokers,
		Topic:     "work-topic",
		Partition: partition,
		MinBytes:  0,
		MaxBytes:  1024 * 1024, // 1M
	})
}
