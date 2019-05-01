package main

import (
	"context"
	pb "experiment/grpc/message"
	"fmt"
	"google.golang.org/grpc"
	"io"
	"log"
	"time"
)

var client pb.BookServiceClient

func getBook(request *pb.GetBookRequest) (*pb.Book, error) {
	log.Printf("[Client] GetBook: request: %v", request)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	response, err := client.GetBook(ctx, request)
	if err != nil {
		return nil, err
	}
	log.Printf("[Client] GetBook: response: %v", response)

	return response, nil
}

func getBooksViaAuthor(request *pb.GetBookViaAuthorRequest) error {
	log.Printf("[Client] GetBooksViaAuthor: request: %v", request)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	stream, err := client.GetBooksViaAuthor(ctx, request)
	if err != nil {
		return err
	}

	for {
		book, err := stream.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		log.Printf("[Client] GetBooksViaAuthor: response book: %v", book)
	}

	return nil
}

func getGreatestBook(requests []*pb.GetBookRequest) error {
	log.Printf("[Client] GetGreatestBook: requests: %v", requests)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	stream, err := client.GetGreatestBook(ctx)
	if err != nil {
		return err
	}

	for _, request := range requests {
		err := stream.Send(request)
		if err != nil {
			return err
		}
	}

	reply, err := stream.CloseAndRecv()
	if err != nil {
		return err
	}
	log.Printf("[Client] GetGreatestBook: response: %v", reply)

	return nil
}

func getBooks(requests []*pb.GetBookRequest) {
	log.Printf("[Client] GetBooks: requests: %v", requests)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	stream, err := client.GetBooks(ctx)
	if err != nil {
		log.Fatalf("[Client] GetBooks: Failed to get stream: %v", err)
	}

	waitc := make(chan struct{})

	// handle books response
	go func() {
		for {
			response, err := stream.Recv()
			if err == io.EOF {
				close(waitc) // read done
				return
			}
			if err != nil {
				log.Fatalf("[Client] GetBooks: Failed to receive a book: %v", err)
			}
			log.Printf("[Client] GetBooks: response book: %v", response)
		}
	}()

	// send book request
	for _, request := range requests {
		if err := stream.Send(request); err != nil {
			log.Fatalf("[Client] GetBooks: Failed to send a request: %v", err)
		}
	}
	if err := stream.CloseSend(); err != nil {
		log.Fatalf("[Client] GetBooks: Failed to close stream: %v", err)
	}

	<-waitc
}

func main() {
	conn, dialErr := grpc.Dial(fmt.Sprintf("%s:%d", "localhost", 56301), grpc.WithInsecure())
	if dialErr != nil {
		log.Fatalf("[Client] grpc.Dial err: %v", dialErr)
	}
	defer conn.Close()

	client = pb.NewBookServiceClient(conn)

	// GetBook
	if _, err := getBook(&pb.GetBookRequest{Isbn: int64(1)}); err != nil {
		log.Printf("[Client] GetBook Err: %v", err)
	}

	// GetBooksViaAuthor
	if err := getBooksViaAuthor(&pb.GetBookViaAuthorRequest{Author: "Test Author"}); err != nil {
		log.Printf("[Client] GetBooksViaAuthor Err: %v", err)
	}

	// GetGreatestBook
	getGreatestBookErr := getGreatestBook([]*pb.GetBookRequest{
		{Isbn: int64(1)}, {Isbn: int64(2)}, {Isbn: int64(3)},
		{Isbn: int64(4)}, {Isbn: int64(5)}, {Isbn: int64(6)},
		{Isbn: int64(7)}, {Isbn: int64(8)}, {Isbn: int64(9)},
	})
	if getGreatestBookErr != nil {
		log.Printf("[Client] GetGreatestBook Err: %v", getGreatestBookErr)
	}

	// GetBooks
	getBooks([]*pb.GetBookRequest{
		{Isbn: int64(1)}, {Isbn: int64(2)}, {Isbn: int64(3)},
		{Isbn: int64(4)}, {Isbn: int64(5)}, {Isbn: int64(6)},
		{Isbn: int64(7)}, {Isbn: int64(8)}, {Isbn: int64(9)},
	})
}
