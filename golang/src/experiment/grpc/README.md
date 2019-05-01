首先需要保证protoc安装过了

brew install protobuf
protobuf 3.7.0

然后使用

go get -u github.com/golang/protobuf/protoc-gen-go

安装protoc go的插件

go的安装本质上都是在命令行下使用git进行安装，因此需要设置全局变量
代理服务器必须是http和https的
export http_proxy=http://127.0.0.1:6152
export https_proxy=http://127.0.0.1:6152