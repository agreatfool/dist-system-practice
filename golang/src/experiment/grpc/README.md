gRPC Golang
===========

## 安装
首先需要保证protoc命令存在：

```bash
$ brew install protobuf
$ protoc --version
libprotoc 3.7.0
```

然后安装protoc的golang插件：

```bash
go get -u github.com/golang/protobuf/protoc-gen-go
```

go的安装本质上都是在命令行下使用git进行安装，因此在网络受阻的情况下需要设置全局变量：
```bash
# 代理服务器必须http和https都存在
export http_proxy=http://127.0.0.1:6152
export https_proxy=http://127.0.0.1:6152
```

## 文件
* bash：build.sh，根据proto文件夹下的protobuf文件生成代码到message文件夹
* message：使用protoc以及go的插件生成的代码
* proto：存放protobuf消息服务定义代码文件
* samples：范例代码文件夹
    * book：完善演示了gRPC功能的范例代码，含单向和双向流
    * concurrency：演示gRPC并发的范例
    * pool：演示gRPC连接池的范例
    * throughput：进行gRPC benchmark测试的范例

## 使用
### book
```bash
$ go run server.go
$ go run client.go
```

### concurrency
```bash
$ DELAY_NO_5=true go run server.go
$ MODE=CONN_ONE_SEQUENCE go run client.go

$ DELAY_NO_5=true go run server.go
$ MODE=CONN_ONE_CONCURRENCY go run client.go
```

### pool
```bash
$ go run server.go
$ go run client.go
```

### throughput
```bash
$ CORE_NUM=3 go run server.go
$ CORE_NUM=4 ROUTINES_PER_CORE=50 VERBOSE=false go run client.go
```
