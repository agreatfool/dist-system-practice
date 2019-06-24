Docker Swarm
============

当前文件夹下的内容是为了演示Docker Swarm集群做的一个简单范例。

## 架构
集群一共2个节点，一个节点上行运行memcached进程，另一个节点上运行memcache_admin，通过overlay网络将两个节点连接起来，做到admin可以访问到memcached进程。

## 文件
* cluster.yaml：集群描述compose配置文件
* cluster.sh：集群启动相关命令脚本

## 使用
cluster.sh命令：

* create：创建两个本地Docker虚拟机
* remove：删除创建的两个虚拟机
* swarm_init：创建Swarm集群，Manager节点是`host1`；根据create产生的虚拟机的IP地址，需要对脚本进行手动调整
* swarm_join：将host2作为Worker加入到集群中，参数为swarm_init成功时给予的token；根据create产生的虚拟机的IP地址，需要对脚本进行手动调整
* swarm_leave：将某个节点脱离Swarm集群，参数为节点名：host1、host2
* swarm_list：列出所有Swarm集群节点
* service_start：部署并启动集群；可以修改源代码使用stack命令进行部署
* service_list：列出所有服务以及stack的状态
* service_stop：停止集群；可以修改源代码使用stack命令进行停止
* service_log：打印出服务日志，参数为服务名
