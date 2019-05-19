Kafka
=====

## kafka集群

该实验代码中使用的是`golang/src/dist-system-practice/bash/dev/docker_kafka.sh`启动的集群：

* zookeeper:
    * 127.0.0.1:2181
* brokers:
    * 127.0.0.1:19092
    * 127.0.0.1:29092
    * 127.0.0.1:39092

一个zookeeper和三个Brokers。

## env
reader有一个env设置，`MODE`：

* GROUP：默认
* NOGROUP

区别：

* `GROUP`使用了consumer group；`NOGROUP`则没有，创建reader时必须提供partition
* `GROUP`使用了显式的消息确认，确认间隔为1秒，会进行批量确认；`NOGROUP`不会进行消息确认，再次打开reader会读取全部数据

## 使用
先启动reader，再启动writer，观察stdout的输出。

```bash
$ MODE=NOGROUP go run reader.go
```

```bash
$ go run writer.go
```