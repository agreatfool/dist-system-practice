Prometheus Federation
=====================

当前文件夹下的内容是为了演示Prometheus的联邦集群做的一个简单范例。

## 架构
该集群一共4个节点：

* node1：采集宿主机的cpu和loadavg信息
* node2：采集宿主机的磁盘及文件信息
* node3：采集宿主机的内存信息
* master：联邦集群主机，采集node1-3节点的信息进行汇总

## 文件
* conf：存放node1-3及master的配置文件以及grafana的配置文件（defaults.ini）
* data：存放4个Prometheus节点的本地数据以及grafana的数据
* log：存放4个Prometheus吐出的命令行日志以及grafana的日志

## 脚本
* run.sh：启动脚本，会启动4个节点
* stop.sh：终止脚本，会杀掉node_exporter及所有的Prometheus进程（注意也会杀掉宿主机上的其他node_exporter和Prometheus进程）
* clear.sh：清理脚本，会删掉data文件夹，删除所有的本地数据

## 使用
* node_exporter访问位置：http://localhost:9100/metrics
* 联邦集群三个子Prometheus节点端口号从 9090 到 9092，即 http://localhost:PORT/federate
* 联邦集群主节点端口号为 9093，即 http://localhost:9093

## 软件版本
* node_exporter-0.17.0.darwin-amd64
* prometheus-2.8.1.darwin-amd64
* grafana-6.1.2.darwin-amd64