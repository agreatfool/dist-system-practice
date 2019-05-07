Envoy Test
==========

## 简介
* 演示范例使用的是docker镜像
* 该范例演示的是front proxy，envoy接受外部HTTP请求，并负载均衡转发给内部的几台HTTP服务器

## 安装
```bash
$ docker pull envoyproxy/envoy:v1.10.0
$ brew install node
```

