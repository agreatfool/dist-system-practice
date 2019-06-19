package rpc

import (
	"context"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/jaeger"
	pb "dist-system-practice/message"
	"encoding/json"
	"fmt"
	"github.com/hlts2/round-robin"
	"github.com/opentracing/opentracing-go"
	"google.golang.org/grpc"
	"net/url"
	"time"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Global
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

const timeout = 15

var instance *Client

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Structure
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

type Config struct {
	// Servers is a list of address: "127.0.0.1:16241".
	Servers []string `json:"servers" yaml:"servers"`
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Apis
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

type Client struct {
	pool map[string]pb.WorkServiceClient
	rr   roundrobin.RoundRobin
}

func (c *Client) getClient() pb.WorkServiceClient {
	return c.pool[c.rr.Next().Host]
}

func (c *Client) GetWork(ctx context.Context, id uint32) (*pb.Work, error) {
	var response *pb.Work
	var err error
	var span opentracing.Span

	ctx, span = jaeger.NewRpcClientSpanFromContext(ctx, "Web.Rpc.GetWork")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		jaeger.FinishRpcClientSpan(span, err)
	}()

	response, err = c.getClient().GetWork(ctx, &pb.WorkId{Id: id})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (c *Client) UpdateViewed(ctx context.Context, id uint32) (*pb.WorkViewed, error) {
	var response *pb.WorkViewed
	var err error
	var span opentracing.Span

	ctx, span = jaeger.NewRpcClientSpanFromContext(ctx, "Web.Rpc.UpdateViewed")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		jaeger.FinishRpcClientSpan(span, err)
	}()

	response, err = c.getClient().UpdateViewed(ctx, &pb.WorkId{Id: id})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (c *Client) GetAchievement(ctx context.Context, id uint32) (*pb.WorkAchievement, error) {
	var response *pb.WorkAchievement
	var err error
	var span opentracing.Span

	ctx, span = jaeger.NewRpcClientSpanFromContext(ctx, "Web.Rpc.GetAchievement")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		jaeger.FinishRpcClientSpan(span, err)
	}()

	response, err = c.getClient().GetAchievement(ctx, &pb.WorkId{Id: id})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (c *Client) PlanWork(ctx context.Context, id uint32) (*pb.Work, error) {
	var response *pb.Work
	var err error
	var span opentracing.Span

	ctx, span = jaeger.NewRpcClientSpanFromContext(ctx, "Web.Rpc.PlanWork")
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		jaeger.FinishRpcClientSpan(span, err)
	}()

	response, err = c.getClient().PlanWork(ctx, &pb.WorkId{Id: id})
	if err != nil {
		return nil, err
	}

	return response, nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Factory
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func Get() *Client {
	return instance
}

func New() *Client {
	if instance != nil {
		return instance
	}

	client := &Client{}
	config := Config{}

	// get config
	conf := common.GetEnv("RPC_SERVERS", "")
	if conf == "" {
		panic("[RPC] No conf provided: RPC_SERVERS")
	}
	conf = fmt.Sprintf("{\"servers\":%s}", conf)

	// parse config yaml
	if err := json.Unmarshal([]byte(conf), &config); err != nil {
		panic(fmt.Sprintf("[RPC] Failed to parse json: %s", err.Error()))
	}

	// check servers count
	if len(config.Servers) == 0 {
		panic("[RPC] Invalid servers config count: 0")
	}
	client.pool = make(map[string]pb.WorkServiceClient, len(config.Servers))

	// loop & init servers
	for _, server := range config.Servers {
		conn, dialErr := grpc.Dial(
			server,
			grpc.WithInsecure(),
		)

		if dialErr != nil {
			panic(fmt.Sprintf("[RPC] grpc.Dial err: %s", dialErr.Error()))
		}

		client.pool[server] = pb.NewWorkServiceClient(conn)
	}

	// build []*net.URL && initialize round robin
	urls := make([]*url.URL, len(config.Servers))
	for i, server := range config.Servers {
		u, err := url.Parse(fmt.Sprintf("//%s", server)) // see: https://github.com/golang/go/issues/19297
		if err != nil {
			panic(fmt.Sprintf("[RPC] Failed to parse url: %s", err.Error()))
		}
		urls[i] = u
	}
	client.rr, _ = roundrobin.New(urls) // only possible error is ErrServersNotExists, has been checked

	instance = client

	return instance
}
