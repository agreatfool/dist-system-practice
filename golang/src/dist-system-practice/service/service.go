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
	"github.com/gorilla/mux"
	"github.com/grpc-ecosystem/go-grpc-middleware/tracing/opentracing"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"google.golang.org/grpc"
	"net"
	"net/http"
	_ "net/http/pprof"
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

	go httpEntrance()

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

func httpEntrance() {
	host := common.GetEnv("WEB_HOST", "0.0.0.0")
	port := common.GetEnv("WEB_PORT", "8001")

	router := mux.NewRouter()
	router.PathPrefix("/debug/pprof/").Handler(http.DefaultServeMux)
	router.Handle("/metrics", promhttp.Handler())

	http.Handle("/", router)

	if err := http.ListenAndServe(fmt.Sprintf("%s:%s", host, port), nil); err != nil {
		fmt.Println(err)
	}
}
