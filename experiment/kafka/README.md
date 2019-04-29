Kafka Test
==========

当前文件夹下内容是为了演示Kafka的最基本功能做的一个范例。

## 架构
该集群一共4个节点：

* zookeeper：集群管理，地址：localhost:2181
* broker1：kafka节点1，地址：localhost:9092
* broker2：kafka节点2，地址：localhost:9093
* broker3：kafka节点3，地址：localhost:9094

## 文件

* conf：存放kafka1-3及zookeeper的配置文件
* data：存放3个kafka节点的本地数据以及软链接过来的/private/tmp/zookeeper文件夹（该文件夹位置无法更改，脚本没有给设置项能更改）
* log：存放zookeeper作为守护进程启动时候的产生的日志

业务日志因为官方的bash脚本并没有提供日志输出的配置，因此日志只能输出在相对于kafka bin文件夹的../logs这个位置。除非修改官方的bash脚本和log4j配置文件否则无法更改。

## 脚本

* run.sh：启动脚本，会启动4个节点，然后创建topic、显示topic拓扑结构、往topic里创建数据、读出topic里的数据
* stop.sh：终止脚本，会杀掉4个节点
* clear.sh：清理脚本，会删掉data文件夹、log文件夹，删除所有的本地数据

## 软件版本

* kafka_2.12-2.2.0