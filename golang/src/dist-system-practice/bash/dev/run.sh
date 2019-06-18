#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

export GOPATH="${BASEPATH}/../.."
export GOBIN="${GOPATH}/bin"
export GOROOT="/usr/local/Cellar/go/1.12/libexec" # OSX brew
export GO111MODULE=on # see: https://github.com/golang/go/wiki/Modules#how-to-install-and-activate-module-support

function web() {
    cd ${BASEPATH}/web

    APP_NAME="app.web" \
    LOGGER_CONF_PATH="${BASEPATH}/conf/dev/logger.yaml" \
    WEB_HOST="0.0.0.0" \
    WEB_PORT="8000" \
    MAX_WORK_ID="1" \
    RPC_CONF_PATH="${BASEPATH}/conf/dev/rpc.yaml" \
    JAEGER_SERVICE_NAME="app.web" \
    JAEGER_AGENT_HOST="127.0.0.1" \
    JAEGER_AGENT_PORT="6831" \
    JAEGER_REPORTER_LOG_SPANS="true" \
    JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
    JAEGER_SAMPLER_TYPE="probabilistic" \
    JAEGER_SAMPLER_PARAM="1" \
    go run web.go
}

function service() {
    cd ${BASEPATH}/service

    APP_NAME="app.service" \
    LOGGER_CONF_PATH="${BASEPATH}/conf/dev/logger.yaml" \
    CACHE_CONF_PATH="${BASEPATH}/conf/dev/cache.yaml" \
    MYSQL_CONF_PATH="${BASEPATH}/conf/dev/mysql.yaml" \
    SERVICE_HOST="127.0.0.1" \
    SERVICE_PORT="16241" \
    WEB_HOST="0.0.0.0" \
    WEB_PORT="8001" \
    KAFKA_BROKERS='["127.0.0.1:19092","127.0.0.1:29092","127.0.0.1:39092"]' \
    KAFKA_WRITE_ASYNC="false" \
    JAEGER_SERVICE_NAME="app.service" \
    JAEGER_AGENT_HOST="127.0.0.1" \
    JAEGER_AGENT_PORT="6841" \
    JAEGER_REPORTER_LOG_SPANS="true" \
    JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
    JAEGER_SAMPLER_TYPE="probabilistic" \
    JAEGER_SAMPLER_PARAM="1" \
    go run service.go
}

function consumer() {
    cd ${BASEPATH}/consumer

    APP_NAME="app.consumer" \
    LOGGER_CONF_PATH="${BASEPATH}/conf/dev/logger.yaml" \
    CACHE_CONF_PATH="${BASEPATH}/conf/dev/cache.yaml" \
    MYSQL_CONF_PATH="${BASEPATH}/conf/dev/mysql.yaml" \
    WEB_HOST="0.0.0.0" \
    WEB_PORT="8002" \
    CONSUMER_ROUTINES="3" \
    CONSUMER_FACTOR="37" \
    KAFKA_BROKERS='["127.0.0.1:19092","127.0.0.1:29092","127.0.0.1:39092"]' \
    JAEGER_SERVICE_NAME="app.consumer" \
    JAEGER_AGENT_HOST="127.0.0.1" \
    JAEGER_AGENT_PORT="6851" \
    JAEGER_REPORTER_LOG_SPANS="true" \
    JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
    JAEGER_SAMPLER_TYPE="probabilistic" \
    JAEGER_SAMPLER_PARAM="1" \
    go run consumer.go
}

function usage() {
    echo "Usage: run.sh web|service|consumer"
}

if [[ $1 != "web" ]] && [[ $1 != "service" ]] && [[ $1 != "consumer" ]]; then
    usage
    exit 0
fi

eval $1