dist-system-practice
====================

## ENV
* APP_NAME：应用名称：web、service、consumer，etc...
* LOGGER_CONF_PATH：日志配置文件位置
* CACHE_CONF_PATH：缓存配置文件位置
* MYSQL_CONF_PATH：数据库配置文件位置

* WEB_HOST：WEB应用的监听HOST
* WEB_PORT：WEB应用的监听PORT
* MAX_WORK_ID：最大可用WorkId，该数值是数据库中单表预建数据的数量值

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