Elasticsearch Test
==================

当前文件夹下内容是为了演示Elasticsearch的最基本功能做的一个范例。

## 架构
* 数据产生：Nginx容器使用bind mount，将日志写到本地磁盘文件
* 数据读取：Filebeat使用Nginx模块，无需配置直接使用
* 数据存储：Elasticsearch使用`discovery.type=single-node`，简化部署
* 数据展示：Filebeat模块setup，自动在Kibana内制作Dashboard，直接在Kibana内使用这些Dashboard即可

Elasticsearch端口：

* 9200 is for REST
* 9300 for nodes communication

## 文件
* conf：存放配置文件
* data：存放运行时的文件资料
* log：运行时的日志输出
* nginx：Nginx容器运行需要的静态html，以及输出的日志

## 脚本
* run.sh：检查并创建/启动/重启Nginx容器，此外，启动Elasticsearch、Kibana、Filebeat
* filebeat_setup.sh：filebeat的Dashboard设置脚本，在run.sh启动的几个服务都启动完成后运行
* send.sh：发送HTTP请求到Nginx容器（产生日志）的脚本，会一直运行，1秒发送1条请求（产生1条日志）
* stop.sh：停止所有服务
* clear.sh：清理本地运行数据

## 使用
* Elasticsearch监听 9200 端口作为API端口
* Elasticsearch监听 9300 端口作为集群内通讯端口
* Kibana监听 5601 端口作为UI端口
* Nginx监听 8080 端口

## 软件版本
filebeat-7.0.0-darwin-x86_64
kibana-7.0.0-darwin-x86_64
elasticsearch-7.0.0-darwin-x86_64

镜像：nginx:1.16.0-alpine

## 注意
* 使用`clear.sh`脚本清理数据之后，务必使用`docker restart nginx`将nginx容器重启启动下，否则容器会丢失文件句柄，日志文件将不会再有内容写入（别问我怎么知道的。。。）