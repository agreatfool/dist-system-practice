package rpc

import (
	"context"
	"dist-system-practice/lib/common"
	pb "dist-system-practice/message"
	"fmt"
	"github.com/hlts2/round-robin"
	"google.golang.org/grpc"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"net/url"
	"time"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Global
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

var timeout = 10

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

func (c *Client) GetWork(id uint32) (*pb.Work, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	defer cancel()

	response, err := c.getClient().GetWork(ctx, &pb.WorkId{Id: id})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (c *Client) UpdateViewed(id uint32) (*pb.WorkViewed, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	defer cancel()

	response, err := c.getClient().UpdateViewed(ctx, &pb.WorkId{Id: id})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (c *Client) GetAchievement(id uint32) (*pb.WorkAchievement, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	defer cancel()

	response, err := c.getClient().GetAchievement(ctx, &pb.WorkId{Id: id})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (c *Client) PlanWork(id uint32) (*pb.Work, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	defer cancel()

	response, err := c.getClient().PlanWork(ctx, &pb.WorkId{Id: id})
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

	var conf []byte
	// get env servers conf
	envServers := common.GetEnv("RPC_SERVERS", "")
	if envServers != "" {
		// use env conf if exists
		conf = []byte(fmt.Sprintf("{\"servers\":%s}", envServers))
	} else {
		// check config file otherwise
		// get config path string
		confPath := common.GetEnv("RPC_CONF_PATH", "")
		if confPath == "" {
			panic("[RPC] No conf path provided: RPC_CONF_PATH")
		}

		// read config into string
		var ioErr error
		if conf, ioErr = ioutil.ReadFile(confPath); ioErr != nil {
			panic(fmt.Sprintf("[RPC] Failed to read conf file: %s", ioErr.Error()))
		}
	}

	// parse config yaml
	if err := yaml.Unmarshal(conf, &config); err != nil {
		panic(fmt.Sprintf("[RPC] Failed to parse yaml: %s", err.Error()))
	}

	// check servers count
	if len(config.Servers) == 0 {
		panic("[RPC] Invalid servers config count: 0")
	}
	client.pool = make(map[string]pb.WorkServiceClient, len(config.Servers))

	// loop & init servers
	for _, server := range config.Servers {
		conn, dialErr := grpc.Dial(server, grpc.WithInsecure())

		if dialErr != nil {
			panic(fmt.Sprintf("[RPC] grpc.Dial err: %s", dialErr.Error()))
		}

		client.pool[server] = pb.NewWorkServiceClient(conn)
	}

	// build []*net.URL && initialize round robin
	urls := make([]*url.URL, len(config.Servers))
	for i, server := range config.Servers {
		u, err := url.Parse(server)
		if err != nil {
			panic(fmt.Sprintf("[RPC] Failed to parse url: %s", err.Error()))
		}
		urls[i] = u
	}
	client.rr, _ = roundrobin.New(urls) // only possible error is ErrServersNotExists, has been checked

	instance = client

	return instance
}
