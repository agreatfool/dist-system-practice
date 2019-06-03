package main

import (
	"dist-system-practice/lib/cache"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/dao"
	"dist-system-practice/lib/database"
	"dist-system-practice/lib/jaeger"
	lkafka "dist-system-practice/lib/kafka"
	"dist-system-practice/lib/logger"
	pb "dist-system-practice/message"
	"dist-system-practice/service/rpc"
	"fmt"
	"github.com/grpc-ecosystem/go-grpc-middleware/tracing/opentracing"
	"google.golang.org/grpc"
	"net"
	"os"
)

func main() {
	// ensure env
	// APP_NAME shall be ensured before logger initialized
	if common.GetEnv("APP_NAME", "") == "" {
		if err := os.Setenv("APP_NAME", "Service"); err != nil {
			panic(fmt.Sprintf("[Service] Failed to set env APP_NAME: %s", err.Error()))
		}
	}

	// initialize utilities
	logger.New()
	cache.New()
	database.New()
	dao.New()
	lkafka.NewWriter()
	jaeger.New()

	// service app
	host := common.GetEnv("SERVICE_HOST", "0.0.0.0")
	port := common.GetEnv("SERVICE_PORT", "16241")

	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%s", host, port))
	if err != nil {
		panic(fmt.Sprintf("[Service] Failed to listen: %s", err.Error()))
	}
	s := grpc.NewServer(grpc.UnaryInterceptor(grpc_opentracing.UnaryServerInterceptor()))
	pb.RegisterWorkServiceServer(s, rpc.New())
	if err := s.Serve(lis); err != nil {
		panic(fmt.Sprintf("[Service] Failed to serve: %s", err.Error()))
	}
}
