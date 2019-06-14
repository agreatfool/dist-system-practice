dist-system-practice
====================

## ENV
* APP_NAME：应用名称：web、service、consumer，etc...
* LOGGER_CONF_PATH：日志配置文件位置
* CACHE_CONF_PATH：缓存配置文件位置
* MYSQL_CONF_PATH：数据库配置文件位置
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
* WEB_HOST：WEB应用的监听HOST
* WEB_PORT：WEB应用的监听PORT
* MAX_WORK_ID：最大可用WorkId，该数值是数据库中单表预建数据的数量值
* API_GET_WORK_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* API_UPDATE_VIEWED_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* API_GET_ACHIEVEMENT_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* API_PLAN_WORK_PERCENTAGE_COUNT：随机API调用的概率配置，`count / total_count`就是该API会被调用的概率
* RPC_CONF_PATH：RPC配置文件位置
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
* CACHE_CONF_PATH：同上
* MYSQL_CONF_PATH：同上
* SERVICE_HOST：Service应用的监听HOST
* SERVICE_PORT：Service应用的监听PORT
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
* CACHE_CONF_PATH：同上
* MYSQL_CONF_PATH：同上
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
* Memcached: 127.0.0.1:11211
* Memcached Admin: 127.0.0.1:9083
* MySQL: 127.0.0.1:3306
* Web: 127.0.0.1:8000
* Service: 127.0.0.1:16241
* Zookeeper: 127.0.0.1:2181
* Kafka:
    * 127.0.0.1:19092
    * 127.0.0.1:29092
    * 127.0.0.1:39092

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
* bash/dev/run.sh consumer
* bash/dev/run.sh service
* bash/dev/run.sh web

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

## TODO
* zap的错误输出日志为空；分离业务和错误日志
* zap的配置，以及类似caller之类的Encoder的使用
* gin配置zap之后，有一条输出的日志里有latency，该时间的单位需要查证

## Note
* [Got "ambiguous import: found github.com/ugorji/go/codec in multiple modules" after upgraded to latest (1.3.1) #1673](https://github.com/gin-gonic/gin/issues/1673#issuecomment-482023570)
* [cmd/go: <go module bug with github.com/ugorji/go > #29332](https://github.com/golang/go/issues/29332#issuecomment-448669442)
* [怎么样输出错误日志到别外的一个文件中 #643](https://github.com/uber-go/zap/issues/643)