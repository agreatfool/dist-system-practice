dist-system-practice
====================

当前README内的内容皆为程序服务，如需要了解项目相关的内容，请移步博客：[分布式系统实战](https://xenojoshua.com/2019/07/dist-system-practice/){:target="_blank"}。

## ENV
* APP_NAME：应用名称：web、service、consumer，etc...
* LOGGER_CONF_PATH：日志配置文件位置
* JAEGER_SERVICE_NAME：值应该同APP_NAME
* JAEGER_AGENT_HOST：agent的host
* JAEGER_AGENT_PORT：agent的port
* JAEGER_REPORTER_LOG_SPANS：是否附加span，true
* JAEGER_REPORTER_FLUSH_INTERVAL：输出间隔，1s
* JAEGER_SAMPLER_TYPE：采样类型，probabilistic
* JAEGER_SAMPLER_PARAM：采样变量，采样率，debug：1，production：0.01

### Web
* APP_NAME：同上
* LOGGER_CONF_PATH：同上
* WEB_HOST：WEB应用的监听HOST，默认：0.0.0.0
* WEB_PORT：WEB应用的监听PORT，默认：8000
* MAX_WORK_ID：最大可用WorkId，该数值是数据库中单表预建数据的数量值
* API_GET_WORK_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* API_UPDATE_VIEWED_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* API_GET_ACHIEVEMENT_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* API_PLAN_WORK_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* RPC_SERVERS：RPC服务器的节点列表，json数组字符串，e.g ["127.0.0.1:16241"]
* JAEGER_SERVICE_NAME：同上
* JAEGER_AGENT_HOST：同上
* JAEGER_AGENT_PORT：同上
* JAEGER_REPORTER_LOG_SPANS：同上
* JAEGER_REPORTER_FLUSH_INTERVAL：同上
* JAEGER_SAMPLER_TYPE：同上
* JAEGER_SAMPLER_PARAM：同上

### Service
* APP_NAME：同上
* LOGGER_CONF_PATH：同上
* CACHE_SERVERS：Cache服务的节点列表，json数组字符串，e.g ["127.0.0.1:11211"]
* DB_HOST：Db host，e.g 127.0.0.1
* DB_PORT：Db port，e.g 3306
* DB_USER：Db username，e.g root
* DB_PWD：Db password
* DB_NAME：Db database name
* DB_CHARSET：Db charset，e.g utf8mb4
* DB_COLLATION：Db collation，e.g utf8mb4_general_ci
* DB_MAX_OPEN_CONN：Db max open connection count，e.g 10
* DB_MAX_IDLE_CONN：Db max idle connection count，e.g 10
* DB_CONN_MAX_LIFE_TIME：Db connection max life time in seconds，e.g 300
* SERVICE_HOST：Service应用的监听HOST，默认：0.0.0.0
* SERVICE_PORT：Service应用的监听PORT，默认：16241
* WEB_HOST：同上，默认：0.0.0.0；用来输出prometheus metrics
* WEB_PORT：同上，默认：8001
* KAFKA_BROKERS：Kafka服务的节点列表，json数组字符串，e.g ["127.0.0.1:19092","127.0.0.1:29092","127.0.0.1:39092"]
* KAFKA_WRITE_ASYNC：是否在向写入Kafka写入数据的时候使用异步调用，如果给"true"则异步，"false"则同步；异步性能会有飞跃，但极不安全
* JAEGER_SERVICE_NAME：同上
* JAEGER_AGENT_HOST：同上
* JAEGER_AGENT_PORT：同上
* JAEGER_REPORTER_LOG_SPANS：同上
* JAEGER_REPORTER_FLUSH_INTERVAL：同上
* JAEGER_SAMPLER_TYPE：同上
* JAEGER_SAMPLER_PARAM：同上

### Consumer
* APP_NAME：同上
* LOGGER_CONF_PATH：同上
* CACHE_SERVERS：同上
* DB_HOST：同上
* DB_PORT：同上
* DB_USER：同上
* DB_PWD：同上
* DB_NAME：同上
* DB_CHARSET：同上
* DB_COLLATION：同上
* DB_MAX_OPEN_CONN：同上
* DB_MAX_IDLE_CONN：同上
* DB_CONN_MAX_LIFE_TIME：同上
* WEB_HOST：同上，默认：0.0.0.0；用来输出prometheus metrics
* WEB_PORT：同上，默认：8002
* CONSUMER_ROUTINES：在启动consumer app的时候，同时启动多少个routine并发处理message，默认为1；这个数值 = partition / consumer app count
* CONSUMER_FACTOR：数字值，按设计consumer会计算一个值，该配置决定了运算的难度；ok: 37-39, edge: 40, default: 37
* KAFKA_BROKERS：同上
* JAEGER_SERVICE_NAME：同上
* JAEGER_AGENT_HOST：同上
* JAEGER_AGENT_PORT：同上
* JAEGER_REPORTER_LOG_SPANS：同上
* JAEGER_REPORTER_FLUSH_INTERVAL：同上
* JAEGER_SAMPLER_TYPE：同上
* JAEGER_SAMPLER_PARAM：同上

## Dev Env
* Memcached: 
    * Server: 127.0.0.1:11211
    * Exporter: 127.0.0.1:9150
* Memcached Admin: 127.0.0.1:9083
* MySQL: 
    * Server: 127.0.0.1:3306
    * Exporter: 127.0.0.1:9104
* Web: 127.0.0.1:8000
* Service: 
    * 127.0.0.1:16241 service 
    * 127.0.0.1:8001 metrics
* Consumer: 127.0.0.1:8002 metrics
* Kafka:
    * Zookeeper: 127.0.0.1:2181
    * Broker:
        * 127.0.0.1:9092
            * 19092
            * 29092
            * 39092
    * Exporter: 127.0.0.1:9308
* Cassandra: 127.0.0.1:9042
* Jaeger:
    * Query: 127.0.0.1:16686
    * Collector: 
        * 127.0.0.1:14250 grpc
        * 127.0.0.1:14268 metrics
    * Agent:
        * 127.0.0.1:6831 compact
            * 6831
            * 6841
            * 6851
        * 127.0.0.1:5778 metrics
* Elasticsearch:
    * Kibana: 127.0.0.1:5601
    * Node:
        * 127.0.0.1:9200 client
            * 9201
            * 9202
            * 9203
        * 127.0.0.1:9300 cluster
    * Exporter:
        * 127.0.0.1:9114
    * Filebeat: 127.0.0.1:5066
    * Filebeat Exporter: 127.0.0.1:9479

## Deployment
### Dev
#### Deploy
* bash/dev/docker_memcached.sh start
* bash/dev/docker_mysqld.sh start
* bash/dev/docker_mysqld.sh connect | use dist; | insert into work values (); | select * from work \G
* bash/dev/docker_kafka.sh start
* bash/dev/docker_kafka.sh init
* bash/dev/docker_cassandra.sh start
* bash/dev/docker_cassandra.sh init
* bash/dev/docker_jaeger.sh start
* bash/dev/docker_elasticsearch.sh start
* bash/dev/docker_elasticsearch.sh init
* bash/dev/docker_prometheus.sh start

#### Log
* bash/dev/logs.sh reset
* bash/dev/logs.sh web
* bash/dev/logs.sh service
* bash/dev/logs.sh consumer

#### App

本地直接运行：

* bash/dev/run.sh local consumer
* bash/dev/run.sh local service
* bash/dev/run.sh local web

本地容器运行：

* bash/dev/run.sh container consumer
* bash/dev/run.sh container service
* bash/dev/run.sh container web

#### Test
* bash/dev/query.sh work
* bash/dev/query.sh viewed
* bash/dev/query.sh achievement
* bash/dev/query.sh plan

## Versions
```bash
$ docker --version
# Docker version 18.09.2, build 6247962

$ docker-compose --version
# docker-compose version 1.23.2, build 1110ad01
```

## Files

```
dist-system-practice/-
                     | bash /-                                  # 自动化脚本
                     |       | build /-                         # 构建脚本
                     |       |        | build_app.sh            # 构建 web、service、consumer 三个应用镜像的脚本
                     |       |        | build_beat_exporter.sh  # 构建 beat_exporter 镜像的脚本
                     |       |        | build_proto.sh          # 由 proto 文件生成 go stub 代码的脚本
                     |       | dev /-                           # dev 环境自动化脚本
                     |       |      | clear.sh                  # 清除本地磁盘残留
                     |       |      | docker*.sh                # 各组件的 docker 镜像启动脚本
                     |       |      | log.sh                    # 日志相关，清理、创建、重置
                     |       |      | query.sh                  # 向启动完成的集群发送请求的脚本
                     |       |      | run.sh                    # web、service、consumer 三个应用的启动脚本
                     |       | prod /-
                     |       |       | cluster /-
                     |       |       |          | cluster.sh    # prod 环境自动化脚本
                     | conf /-
                     |       | dev      # dev 环境配置文件
                     |       | prod     # prod 环境配置文件
                     | consumer         # consumer 应用代码
                     | data /-          # 一些测试生成的数据文件
                     |       | linode   # Linode 硬件的 benchmark 数据
                     |       | vultr    # Vultr 硬件的 benchmark 数据
                     | lib              # library 代码文件
                     | message          # 由 proto 文件生成的 go stub 代码
                     | proto            # protobuf 消息定义文件
                     | schema           # 数据库 schema SQL
                     | service          # service 应用代码
                     | vendors /-                                       # 第三方工具相关资源
                     |          | kafka /-                              # Kafka 相关资源
                     |          |        | kafka                        # 文件夹是 Kafka 可执行文件包
                     |          |        | jmx*                         # 用来进行 Kafka 镜像内 JMX Metrics 输出用
                     |          |        | messages.txt                 # 用来测试 Kafka 集群消息收发的模拟数据
                     |          | prometheus /-                         # Prometheus 相关资源
                     |          |             | bin                     # 文件夹下只有一个 node_exporter，方便在镜像外运行
                     |          |             | grafana /-              # Grafana 相关资源
                     |          |             |          | dashboard    # Grafana 一系列 dashboard 模板
                     |          |             |          | provisioning # Grafana 启动时需要导入的数据
                     | web  # web 应用代码
```