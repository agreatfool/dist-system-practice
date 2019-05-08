Envoy Test
==========

## 简介
* 演示范例使用的是envoy的docker镜像
* 该范例演示的是负载均衡front proxy，envoy接受外部HTTP请求，并负载均衡转发给内部的几台HTTP服务器

## 安装
```bash
$ docker pull envoyproxy/envoy:v1.10.0
$ docker pull node:10.15.3-alpine
```

## 架构
* curl作为客户端，发送简单的HTTP请求
* envoy作为前端代理，接受curl过来的HTTP请求
* 两个node进程，启动两个HTTP服务器，作为负载均衡upstream配置在envoy里
* envoy和两个node进程分别是三个不同的docker容器，使用同一个docker network连接在一起

## 文件
* conf：配置文件夹，存放envoy的配置文件，该文件夹会使用docker volume映射到容器中：`/etc/envoy`
* httpserver：node的HTTP服务器文件夹
    * Dockerfile：用来构建node镜像的Dockerfile，node必须运行在容器中，才可以连接在envoy同一个network中
    * index.js：node的HTTP服务器代码
* log：日志文件夹，该文件夹会使用docker volume映射到容器中：`/tmp`
    * access.log：根据envoy的配置，envoy listener接收到的请求访问日志
    * admin_access.log：根据envoy的配置，admin页面接收到的请求访问日志

## 脚本
* run.sh：启动脚本，会构建node镜像，然后启动envoy以及两个node容器
* clear.sh：清理脚本，会停止三个容器，并删除测试镜像，以及本地的日志文件

## 使用
```bash
$ curl -v "http://127.0.0.1:9988"
```

多次发送，观察返回结果中的端口号的变化（负载均衡）：

```bash
# Server on port 8098 handling the request: /
# Server on port 8099 handling the request: /
```

envoy的端口：

* 9901：admin接口
* 9988：envoy前端代理

## 版本
* envoy：`1.10.0`
* node：只要是支持ES6的版本都可以