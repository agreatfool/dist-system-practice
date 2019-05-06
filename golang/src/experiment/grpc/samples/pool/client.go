package main

import (
	"context"
	pb "experiment/grpc/message"
	"fmt"
	"github.com/processout/grpc-go-pool"
	"google.golang.org/grpc"
	"log"
	"time"
)

var pool *grpcpool.Pool

func factory() (*grpc.ClientConn, error) {
	conn, err := grpc.Dial(fmt.Sprintf("%s:%d", "localhost", 56301), grpc.WithInsecure())
	if err != nil {
		log.Fatalf("[Client] grpc.Dial err: %v", err)
	}
	return conn, err
}

func echo(id int) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	conn, err := pool.Get(context.Background())
	if err != nil {
		log.Fatalf("[Client] pool.Get: err: %v", err)
	}
	defer conn.Close()

	client := pb.NewEchoServiceClient(conn.ClientConn)

	start := time.Now()
	if response, err := client.Echo(ctx, &pb.EchoRequest{Id: int64(id)}); err != nil {
		log.Fatalf("[Client] echo: err: %v", err)
	} else {
		end := time.Now()
		elapsed := end.Sub(start)
		fmt.Printf("[Client] echo: conn: %p, response: %v, consumed: %v\n", conn, response, elapsed)
	}
}

func main() {
	npool, err := grpcpool.New(factory, 5, 5, 10*time.Second)
	if err != nil {
		log.Fatalf("[Client] Failed to create gRPC pool: %v", err)
	}

	pool = npool

	for i := 1; i < 10; i++ {
		go func(id int) {
			for {
				echo(id)
			}
		}(i)
	}

	select {}
}
