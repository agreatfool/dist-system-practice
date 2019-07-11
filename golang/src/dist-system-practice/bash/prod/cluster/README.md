cluster
=======

本工具的目标是在线上分布式主机上，进行dist-system-practice项目集群部署，并进行自动化运行。

## 命令
* `./cluster.sh --machine`：读取主机配置，并按顺序一个个`docker-machine create ...`，安装好docker环境
* `./cluster.sh --hardware`：远程对主机进行benchmark，并出具报告
* `./cluster.sh --image`：根据配置，安排远程主机下载后续会用到的docker镜像文件，并上传一些后续会用到的配置和可执行文件
* `./cluster.sh --deploy --machine-type=*`：进行远程主机的服务部署
    * --machine-type 有效
    * --exclude-service-types 有效
* `./cluster.sh --stop --machine-type=*`：进行远程主机的服务关闭
    * --machine-type 有效
    * --exclude-service-types 有效
* `./cluster.sh --start --machine-type=*`：进行远程主机的服务开启
    * --machine-type 有效
    * --exclude-service-types 有效
* `./cluster.sh --cleanup --machine-type=*`：进行远程主机的服务停止以及删除清理
    * --machine-type 有效
    * --exclude-service-types 有效
* `./cluster.sh --report`：从Grafana下载测试期间的监控数据，并按照模板创建汇报文档草稿
* `./cluster.sh --stress`：根据全局变量配置，生成压测用命令行命令，实际执行仍旧需要手动到远程主机上进行
* `./cluster.sh --docker-ps --machine-type=*`：列出远程主机上docker进程状态
    * --machine-type 有效

## 参数
### 全局变量配置
全局变量参数配置全部都在`cluster.sh`文件中，该文件既是脚本的入口，又是脚本的配置。

配置清单：

* MYSQL_USER="root"：数据库用户名
* MYSQL_PWD="4E3Gd0F0Eokf576P"：数据库密码
* MYSQL_DB="dist"：数据库名
* MYSQL_CONN_NUM="900"：数据库最大连接数
* MAX_WORK_ID="5000000"：数据库表数据量
* MEMCACHED_MEM="512"：Memcached内存量
* KAFKA_JVM_MEM="512M"：Kafka的JVM内存量
* KAFKA_TOPIC="work-topic"：Kafka Topic名
* KAFKA_PARTITIONS="20"：Kafka Topic的分片数量
* CAS_JVM_MEM="1G"：Cassandra的JVM内存量
* CAS_HEAP_SIZE="768M"：Cassandra的堆内存量
* CAS_HEAP_NEWSIZE="512M"：Cassandra的新生代内存量
* ES_JVM_MEM="512M"：Elasticsearch的JVM内存量
* GRAFANA_USER="admin"：Grafana用户名
* GRAFANA_PWD="4E3Gd0F0Eokf576P"：Grafana密码
* API_GET_WORK_PERCENTAGE_COUNT="4500"：Web服务器随机API概率，apiGetWork
* API_UPDATE_VIEWED_PERCENTAGE_COUNT="2500"：Web服务器随机API概率，apiUpdateViewed
* API_GET_ACHIEVEMENT_PERCENTAGE_COUNT="2500"：Web服务器随机API概率，apiGetAchievement
* API_PLAN_WORK_PERCENTAGE_COUNT="500"：Web服务器随机API概率，apiPlanWork
* CONSUMER_FACTOR="37"：Consumer的计算因子
* HOST_IP_CLIENT="192.168.3.111"：Client主机IP
* HOST_IP_STORAGE="192.168.3.111"：Storage主机IP
* HOST_IP_KAFKA_1="192.168.3.111"：Kafka1主机IP
* HOST_IP_KAFKA_2="192.168.3.111"：Kafka2主机IP
* HOST_IP_ES_1="192.168.3.111"：Elasticsearch2主机IP
* HOST_IP_ES_2="192.168.3.111"：Elasticsearch1主机IP
* HOST_IP_MONITOR="127.0.0.1"：Monitor主机IP
* HOST_IP_WEB="192.168.3.111"：Web主机IP
* HOST_IP_SERVICE="192.168.3.111"：Service主机IP
* GRAFANA_API="eyJrIjoiUkhTVDhDWDM2VWdxQW81MTQ1cjdLWklDSnoxTUZjcDIiLCJuIjoiY2x1c3RlciIsImlkIjoxfQ=="：Grafana API Key
* GRAFANA_START="1562493600000"：Grafana数据获取的开始时间点，timestamp * 1000
* GRAFANA_END="1562495400000"：Grafana数据获取的结束时间点，timestamp * 1000
* GRAFANA_WIDTH="1000"：Grafana截图Width
* GRAFANA_HEIGHT="500"：Grafana截图Height
* GRAFANA_TIMEZONE="Asia/Shanghai"：Grafana API调用时区
* STRESS_CONNECTIONS="10000"：压测并发数
* STRESS_DURATION="30s"：压测时长
* STRESS_RATE="10/s"：压测QPS
* STRESS_TIMEOUT="30s"：压测请求超时时长
* STRESS_WORKERS="1000"：压测线程数

### 拓扑配置
服务的拓扑结构（基本不变）存放在`src/index.ts`代码文件中：

```typescript
interface Machine {
    name: string;
    type: string;
    ip: string;
    services: Array<Service>;
}

interface Service {
    name: string;
    type: string;
    image: string;
}
```

配置存储在全局变量`MACHINES`里：

```typescript
const MACHINES: Array<Machine> = [
    {
        "name": "client",
        "type": "client",
        "ip": process.env.HOST_IP_CLIENT,
        "services": [
            {"name": "node_client", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_client", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "vegeta", "type": "vegeta", "image": "peterevans/vegeta:6.5.0"}
        ],
    },
    {
        "name": "storage",
        "type": "storage",
        "ip": process.env.HOST_IP_STORAGE,
        "services": [
            {"name": "node_storage", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_storage", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "mysqld", "type": "mysqld", "image": "mysql:5.7.26"},
            {"name": "mysqld_exporter", "type": "mysqld_exporter", "image": "prom/mysqld-exporter:v0.11.0"},
            {"name": "memcached", "type": "memcached", "image": "memcached:1.5.14-alpine"},
            {"name": "memcached_exporter", "type": "memcached_exporter", "image": "prom/memcached-exporter:v0.5.0"}
        ],
    },
    // ...
];
```

### Grafana报表数据导出相关配置
相关配置（基本不变）也存放在`src/index.ts`代码文件中：

```typescript
interface ReportConfig {
    type: string; // same to service type
    uid: string; // dashboard uid
    node: string; // dashboard url node
    params: { [key: string]: string };
    panels: Array<ReportPanel>;
}

interface ReportPanel {
    id: number; // panel id
    display: string; // display name used in report
    file: string; // capture image file name
}
```

配置存储在全局变量`REPORT_CONFIG`里：

```typescript
const REPORT_CONFIG: Array<ReportConfig> = [
    {
        "type": "node_exporter",
        "uid": "9CWBz0bik",
        "node": "nodes",
        "params": {
            "var-interval": "5s",
            "var-env": "All",
            "var-name": "All",
            "var-node": "", // dynamic
            "var-maxmount": "",
        },
        "panels": [
            {"id": 15, "display": "系统运行时间", "file": "system_up_time"},
            {"id": 14, "display": "CPU 核数", "file": "cpu_core_count"},
            {"id": 75, "display": "内存总量", "file": "memory_total"},
            {"id": 167, "display": "CPU使用率（5m）", "file": "cpu_usage_5m"},
            {"id": 20, "display": "CPU iowait（5m）", "file": "cpu_iowait_5m"},
            {"id": 172, "display": "内存使用率", "file": "memory_usage"},
            {"id": 16, "display": "当前打开的文件描述符", "file": "open_files"},
            {"id": 166, "display": "根分区使用率", "file": "disk_usage"},
            {"id": 13, "display": "系统平均负载", "file": "load_average"},
            {"id": 171, "display": "磁盘总空间", "file": "disk_total"},
            {"id": 164, "display": "各分区可用空间", "file": "disk_usage_total"},
            {"id": 7, "display": "CPU使用率、磁盘每秒的I/O操作耗费时间（%）", "file": "disk_cpu_time"},
            {"id": 156, "display": "内存信息", "file": "memory_info"},
            {"id": 161, "display": "磁盘读写速率（IOPS）", "file": "disk_iops"},
            {"id": 168, "display": "磁盘读写容量大小", "file": "disk_io_amount"},
            {"id": 160, "display": "磁盘IO读写时间", "file": "disk_io_time"},
            {"id": 157, "display": "网络流量", "file": "network_traffic"},
            {"id": 158, "display": "TCP 连接情况", "file": "tcp_count"},
        ],
    },
    {
        "type": "cadvisor",
        "uid": "PV1XyHnWz",
        "node": "docker-and-system-monitoring",
        "params": {
            "refresh": "30s",
            "var-containergroup": "All",
            "var-interval": "30s",
            "var-server": "", // dynamic
            "var-name": "All",
        },
        "panels": [
            {"id": 8, "display": "Received Network Traffic per Container", "file": "received_network_traffic"},
            {"id": 9, "display": "Sent Network Traffic per Container", "file": "sent_network_traffic"},
            {"id": 1, "display": "CPU Usage per Container", "file": "cpu_usage"},
            {"id": 10, "display": "Memory Usage per Container", "file": "memory_usage"},
            {"id": 34, "display": "Memory Swap per Container", "file": "memory_swap"},
        ]
    },
    // ...
];
```
