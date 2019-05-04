package main

import (
	"context"
	pb "experiment/grpc/message"
	"fmt"
	"google.golang.org/grpc"
	"log"
	"net"
	"os"
	"runtime"
	"strconv"
)

type ServerImpl struct {
	pb.EchoServiceServer
}

func (s *ServerImpl) Echo(ctx context.Context, in *pb.EchoRequest) (*pb.EchoResponse, error) {
	// log.Printf("[Server] Echo: request: %v", in)
	response := &pb.EchoResponse{Id: in.Id}
	// log.Printf("[Server] Echo: response: %v", response)

	return response, nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func main() {
	envCoreNum := getEnv("CORE_NUM", "2")
	core, convErr := strconv.Atoi(envCoreNum)
	if convErr != nil {
		log.Fatalf("[Client] strconv.Atoi err: %v", convErr)
	}

	runtime.GOMAXPROCS(core)

	// Server
	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%d", "localhost", 56301))
	if err != nil {
		log.Fatalf("[Server] Failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterEchoServiceServer(s, &ServerImpl{})
	if err := s.Serve(lis); err != nil {
		log.Fatalf("[Server] Failed to serve: %v", err)
	}
}
