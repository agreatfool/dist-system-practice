package main

import (
	"context"
	pb "experiment/grpc/message"
	"fmt"
	"google.golang.org/grpc"
	"log"
	"net"
)

type ServerImpl struct {
	pb.EchoServiceServer
}

func (s *ServerImpl) Echo(ctx context.Context, in *pb.EchoRequest) (*pb.EchoResponse, error) {
	log.Printf("[Server] Echo: request: %v", in)
	response := &pb.EchoResponse{Id: in.Id}
	log.Printf("[Server] Echo: response: %v", response)

	return response, nil
}

func main() {
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
