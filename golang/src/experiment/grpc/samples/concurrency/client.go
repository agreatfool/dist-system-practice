package main

import (
	"context"
	pb "experiment/grpc/message"
	"fmt"
	"google.golang.org/grpc"
	"log"
	"os"
	"sync"
	"time"
)

const Port = 56301

var mode string

func singleConnSequence() {
	conn, ctx, cancel, err := factoryConn(Port)
	if err != nil {
		log.Fatalf("[Client] singleConnSequence: err: %v", err)
		return
	}
	defer conn.Close()
	defer cancel()
	client := pb.NewEchoServiceClient(conn)

	for i := 1; i <= 10; i++ {
		start := time.Now()
		if response, err := client.Echo(ctx, &pb.EchoRequest{Id: int64(i)}); err != nil {
			log.Fatalf("[Client] singleConnSequence: err: %v", err)
		} else {
			end := time.Now()
			elapsed := end.Sub(start)
			log.Printf("[Client] singleConnSequence: response: %v, consumed: %v", response, elapsed)
		}
	}
}

func singleConnConcurrency() {
	conn, ctx, cancel, err := factoryConn(Port)
	if err != nil {
		log.Fatalf("[Client] singleConnConcurrency: err: %v", err)
		return
	}
	defer conn.Close()
	defer cancel()
	client := pb.NewEchoServiceClient(conn)

	var waitgroup sync.WaitGroup

	for i := 1; i <= 10; i++ {
		waitgroup.Add(1)
		go func(id int) {
			start := time.Now()
			if response, err := client.Echo(ctx, &pb.EchoRequest{Id: int64(id)}); err != nil {
				log.Fatalf("[Client] singleConnConcurrency: err: %v", err)
			} else {
				end := time.Now()
				elapsed := end.Sub(start)
				log.Printf("[Client] singleConnConcurrency: response: %v, consumed: %v", response, elapsed)
			}
			waitgroup.Done()
		}(i)
	}
	waitgroup.Wait()
}

func factoryConn(port int64) (*grpc.ClientConn, context.Context, context.CancelFunc, error) {
	conn, err := grpc.Dial(fmt.Sprintf("%s:%d", "localhost", port), grpc.WithInsecure())
	if err != nil {
		return nil, nil, nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

	return conn, ctx, cancel, nil
}

func main() {
	// Env
	mode = os.Getenv("MODE")

	switch mode {
	case "CONN_ONE_SEQUENCE":
		singleConnSequence()
	case "CONN_ONE_CONCURRENCY":
		singleConnConcurrency()
	default:
		fmt.Println("No env MODE specified, do nothing")
	}
}
