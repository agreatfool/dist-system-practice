package main

import (
	"context"
	pb "experiment/grpc/message"
	"fmt"
	"google.golang.org/grpc"
	"log"
	"os"
	"runtime"
	"strconv"
	"sync/atomic"
	"time"
)

var verbose string
var queries uint64 = 0

func echo(client pb.EchoServiceClient, id int) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	start := time.Now()
	if response, err := client.Echo(ctx, &pb.EchoRequest{Id: int64(id)}); err != nil {
		log.Fatalf("[Client] singleConnConcurrency: err: %v", err)
	} else {
		end := time.Now()
		elapsed := end.Sub(start)
		if verbose == "true" {
			log.Printf("[Client] singleConnConcurrency: response: %v, consumed: %v", response, elapsed)
		}
	}
	atomic.AddUint64(&queries, 1)
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func main() {
	// Env
	envCoreNum := getEnv("CORE_NUM", "2")
	cores, convErr1 := strconv.Atoi(envCoreNum)
	if convErr1 != nil {
		log.Fatalf("[Client] strconv.Atoi err: %v", convErr1)
	}

	envRoutines := getEnv("ROUTINES_PER_CORE", "100")
	routines, convErr2 := strconv.Atoi(envRoutines)
	if convErr2 != nil {
		log.Fatalf("[Client] strconv.Atoi err: %v", convErr2)
	}

	verbose = getEnv("VERBOSE", "false")

	// Threads
	runtime.GOMAXPROCS(cores)

	// Client
	conn, dialErr := grpc.Dial(fmt.Sprintf("%s:%d", "localhost", 56301), grpc.WithInsecure())
	if dialErr != nil {
		log.Fatalf("[Client] grpc.Dial err: %v", dialErr)
	}
	defer conn.Close()

	client := pb.NewEchoServiceClient(conn)

	for i := 0; i < cores*routines; i++ {
		go func(id int) {
			for {
				echo(client, id)
			}
		}(i)
	}

	ticker := time.NewTicker(1000 * time.Millisecond)
	go func() {
		for range ticker.C {
			log.Printf("[Client] %d requests in 1s", atomic.LoadUint64(&queries))
			atomic.StoreUint64(&queries, 0)
		}
	}()

	select {}
}
