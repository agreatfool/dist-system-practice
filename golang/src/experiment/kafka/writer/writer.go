package main

import (
	"github.com/segmentio/kafka-go"
	"golang.org/x/net/context"
	"log"
	"time"
)

func main() {
	brokers := []string{
		"127.0.0.1:19092",
		"127.0.0.1:29092",
		"127.0.0.1:39092",
	}

	log.Println("start to write")
	go writeWithInterval(newWriter(brokers), time.NewTicker(3000*time.Millisecond))
	go writeWithInterval(newWriter(brokers), time.NewTicker(3000*time.Millisecond))
	go writeWithInterval(newWriter(brokers), time.NewTicker(3000*time.Millisecond))

	select {}
}

func writeWithInterval(writer *kafka.Writer, ticker *time.Ticker) {
	for range ticker.C {
		tstr := time.Now().String()
		err := writer.WriteMessages(context.Background(), kafka.Message{
			Key:   nil,
			Value: []byte(tstr),
		})
		if err != nil {
			log.Fatalln(err.Error())
		} else {
			log.Printf("[%p] wrote msg: %s", writer, tstr)
		}
	}
}

func newWriter(brokers []string) *kafka.Writer {
	return kafka.NewWriter(kafka.WriterConfig{
		Brokers:  brokers,
		Topic:    "work-topic",
		Balancer: &kafka.LeastBytes{},
	})
}
