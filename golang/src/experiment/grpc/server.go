package main

import (
	"context"
	pb "experiment/grpc/message"
	"fmt"
	"google.golang.org/grpc"
	"io"
	"log"
	"net"
)

type ServerImpl struct {
	pb.BookServiceServer
}

func (s *ServerImpl) GetBook(ctx context.Context, in *pb.GetBookRequest) (*pb.Book, error) {
	log.Printf("[Server] GetBook: request: %v", in)
	book := &pb.Book{Isbn: in.Isbn, Title: "Dummy Title", Author: "Dummy Author"}
	log.Printf("[Server] GetBook: response: %v", book)

	return book, nil
}

func (s *ServerImpl) GetBooksViaAuthor(in *pb.GetBookViaAuthorRequest, stream pb.BookService_GetBooksViaAuthorServer) error {
	log.Printf("[Server] GetBooksViaAuthor: request: %v", in)

	for i := 1; i <= 10; i++ {
		book := &pb.Book{
			Isbn:   int64(i),
			Title:  fmt.Sprintf("%s%d", "Dummy Title: ", i),
			Author: in.Author,
		}
		log.Printf("[Server] GetBooksViaAuthor: response: %v", book)
		err := stream.Send(book)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *ServerImpl) GetGreatestBook(stream pb.BookService_GetGreatestBookServer) error {
	log.Printf("[Server] GetGreatestBook: request stream: %v", stream)

	var lastIsbn int64

	for {
		request, err := stream.Recv()

		if err == io.EOF {
			book := &pb.Book{
				Isbn:   lastIsbn,
				Title:  "Last Title",
				Author: "Last Author",
			}
			log.Printf("[Server] GetGreatestBook: response: %v", book)

			return stream.SendAndClose(book)
		}
		if err != nil {
			return err
		}

		lastIsbn = request.Isbn
		log.Printf("[Server] GetGreatestBook: request: %v", request)
	}
}

func (s *ServerImpl) GetBooks(stream pb.BookService_GetBooksServer) error {
	for {
		in, err := stream.Recv()

		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}

		log.Printf("[Server] GetBooks: request: %v", in)

		book := &pb.Book{
			Isbn:   in.Isbn,
			Title:  "Dummy Title",
			Author: "Dummy Author",
		}
		log.Printf("[Server] GetBooks: response: %v", book)

		if err := stream.Send(book); err != nil {
			return err
		}
	}
}

func main() {
	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%d", "localhost", 56301))
	if err != nil {
		log.Fatalf("[Server] Failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterBookServiceServer(s, &ServerImpl{})
	if err := s.Serve(lis); err != nil {
		log.Fatalf("[Server] Failed to serve: %v", err)
	}
}
