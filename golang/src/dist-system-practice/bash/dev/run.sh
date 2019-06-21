#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

export GOPATH="${BASEPATH}/../.."
export GOBIN="${GOPATH}/bin"
export GOROOT="/usr/local/Cellar/go/1.12/libexec" # OSX brew
export GO111MODULE=on # see: https://github.com/golang/go/wiki/Modules#how-to-install-and-activate-module-support

#KAFKA_BROKERS='["192.168.3.111:19092","192.168.3.111:29092","192.168.3.111:39092"]'
KAFKA_BROKERS='["192.168.3.111:19092"]'

function web() {
    if [[ $1 != "local" ]] && [[ $1 != "container" ]]; then
        usage
        exit 0
    fi

    cd ${BASEPATH}/web

    if [[ $1 == "local" ]]; then

        APP_NAME="app.web" \
        LOGGER_CONF_PATH="${BASEPATH}/conf/dev/app/logger.yaml" \
        WEB_HOST="0.0.0.0" \
        WEB_PORT="8000" \
        MAX_WORK_ID="1" \
        RPC_SERVERS="[\"127.0.0.1:16241\"]" \
        JAEGER_SERVICE_NAME="app.web" \
        JAEGER_AGENT_HOST="127.0.0.1" \
        JAEGER_AGENT_PORT="6831" \
        JAEGER_REPORTER_LOG_SPANS="true" \
        JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
        JAEGER_SAMPLER_TYPE="probabilistic" \
        JAEGER_SAMPLER_PARAM="1" \
        go run web.go

    elif [[ $1 == "container" ]]; then

        docker run --rm -d \
            --name app_web \
            --network=dist_net \
            -p 8000:8000 \
            -v ${BASEPATH}/conf/dev/app/logger.yaml:/app/logger.yaml \
            -v /tmp/logs:/app/logs \
            -e APP_NAME="app.web" \
            -e LOGGER_CONF_PATH="/app/logger.yaml" \
            -e WEB_HOST="0.0.0.0" \
            -e WEB_PORT="8000" \
            -e MAX_WORK_ID="1" \
            -e RPC_SERVERS="[\"app_service:16241\"]" \
            -e JAEGER_SERVICE_NAME="app.web" \
            -e JAEGER_AGENT_HOST="jagent_web" \
            -e JAEGER_AGENT_PORT="6831" \
            -e JAEGER_REPORTER_LOG_SPANS="true" \
            -e JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
            -e JAEGER_SAMPLER_TYPE="probabilistic" \
            -e JAEGER_SAMPLER_PARAM="1" \
            agreatfool/dist_app_web:0.0.1

        docker logs -f app_web

    fi
}

function service() {
    if [[ $1 != "local" ]] && [[ $1 != "container" ]]; then
        usage
        exit 0
    fi

    cd ${BASEPATH}/service

    if [[ $1 == "local" ]]; then

        APP_NAME="app.service" \
        LOGGER_CONF_PATH="${BASEPATH}/conf/dev/app/logger.yaml" \
        CACHE_SERVERS="[\"127.0.0.1:11211\"]" \
        DB_HOST="127.0.0.1" \
        DB_PORT="3306" \
        DB_USER="root" \
        DB_PWD="abc123" \
        DB_NAME="dist" \
        DB_CHARSET="utf8mb4" \
        DB_COLLATION="utf8mb4_general_ci" \
        DB_MAX_OPEN_CONN="10" \
        DB_MAX_IDLE_CONN="10" \
        DB_CONN_MAX_LIFE_TIME="300" \
        SERVICE_HOST="0.0.0.0" \
        SERVICE_PORT="16241" \
        WEB_HOST="0.0.0.0" \
        WEB_PORT="8001" \
        KAFKA_BROKERS=${KAFKA_BROKERS} \
        KAFKA_WRITE_ASYNC="false" \
        JAEGER_SERVICE_NAME="app.service" \
        JAEGER_AGENT_HOST="127.0.0.1" \
        JAEGER_AGENT_PORT="6841" \
        JAEGER_REPORTER_LOG_SPANS="true" \
        JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
        JAEGER_SAMPLER_TYPE="probabilistic" \
        JAEGER_SAMPLER_PARAM="1" \
        go run service.go

    elif [[ $1 == "container" ]]; then

        docker run --rm -d \
            --name app_service \
            --network=dist_net \
            -p 8001:8001 \
            -v ${BASEPATH}/conf/dev/app/logger.yaml:/app/logger.yaml \
            -v /tmp/logs:/app/logs \
            -e APP_NAME="app.service" \
            -e LOGGER_CONF_PATH="/app/logger.yaml" \
            -e CACHE_SERVERS="[\"memcached:11211\"]" \
            -e DB_HOST="mysqld" \
            -e DB_PORT="3306" \
            -e DB_USER="root" \
            -e DB_PWD="abc123" \
            -e DB_NAME="dist" \
            -e DB_CHARSET="utf8mb4" \
            -e DB_COLLATION="utf8mb4_general_ci" \
            -e DB_MAX_OPEN_CONN="10" \
            -e DB_MAX_IDLE_CONN="10" \
            -e DB_CONN_MAX_LIFE_TIME="300" \
            -e SERVICE_HOST="0.0.0.0" \
            -e SERVICE_PORT="16241" \
            -e WEB_HOST="0.0.0.0" \
            -e WEB_PORT="8001" \
            -e KAFKA_BROKERS=${KAFKA_BROKERS} \
            -e KAFKA_WRITE_ASYNC="false" \
            -e JAEGER_SERVICE_NAME="app.service" \
            -e JAEGER_AGENT_HOST="jagent_service" \
            -e JAEGER_AGENT_PORT="6831" \
            -e JAEGER_REPORTER_LOG_SPANS="true" \
            -e JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
            -e JAEGER_SAMPLER_TYPE="probabilistic" \
            -e JAEGER_SAMPLER_PARAM="1" \
            agreatfool/dist_app_service:0.0.1

        docker logs -f app_service

    fi
}

function consumer() {
    if [[ $1 != "local" ]] && [[ $1 != "container" ]]; then
        usage
        exit 0
    fi

    cd ${BASEPATH}/consumer

    if [[ $1 == "local" ]]; then

        APP_NAME="app.consumer" \
        LOGGER_CONF_PATH="${BASEPATH}/conf/dev/app/logger.yaml" \
        CACHE_SERVERS="[\"127.0.0.1:11211\"]" \
        DB_HOST="127.0.0.1" \
        DB_PORT="3306" \
        DB_USER="root" \
        DB_PWD="abc123" \
        DB_NAME="dist" \
        DB_CHARSET="utf8mb4" \
        DB_COLLATION="utf8mb4_general_ci" \
        DB_MAX_OPEN_CONN="10" \
        DB_MAX_IDLE_CONN="10" \
        DB_CONN_MAX_LIFE_TIME="300" \
        WEB_HOST="0.0.0.0" \
        WEB_PORT="8002" \
        CONSUMER_ROUTINES="3" \
        CONSUMER_FACTOR="37" \
        KAFKA_BROKERS=${KAFKA_BROKERS} \
        JAEGER_SERVICE_NAME="app.consumer" \
        JAEGER_AGENT_HOST="127.0.0.1" \
        JAEGER_AGENT_PORT="6851" \
        JAEGER_REPORTER_LOG_SPANS="true" \
        JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
        JAEGER_SAMPLER_TYPE="probabilistic" \
        JAEGER_SAMPLER_PARAM="1" \
        go run consumer.go

    elif [[ $1 == "container" ]]; then

        docker run --rm -d \
            --name app_consumer \
            --network=dist_net \
            -p 8002:8002 \
            -v ${BASEPATH}/conf/dev/app/logger.yaml:/app/logger.yaml \
            -v /tmp/logs:/app/logs \
            -e APP_NAME="app.consumer" \
            -e LOGGER_CONF_PATH="/app/logger.yaml" \
            -e CACHE_SERVERS="[\"memcached:11211\"]" \
            -e DB_HOST="mysqld" \
            -e DB_PORT="3306" \
            -e DB_USER="root" \
            -e DB_PWD="abc123" \
            -e DB_NAME="dist" \
            -e DB_CHARSET="utf8mb4" \
            -e DB_COLLATION="utf8mb4_general_ci" \
            -e DB_MAX_OPEN_CONN="10" \
            -e DB_MAX_IDLE_CONN="10" \
            -e DB_CONN_MAX_LIFE_TIME="300" \
            -e WEB_HOST="0.0.0.0" \
            -e WEB_PORT="8002" \
            -e CONSUMER_ROUTINES="3" \
            -e CONSUMER_FACTOR="37" \
            -e KAFKA_BROKERS=${KAFKA_BROKERS} \
            -e JAEGER_SERVICE_NAME="app.consumer" \
            -e JAEGER_AGENT_HOST="127.0.0.1" \
            -e JAEGER_AGENT_PORT="6831" \
            -e JAEGER_REPORTER_LOG_SPANS="true" \
            -e JAEGER_REPORTER_FLUSH_INTERVAL="1s" \
            -e JAEGER_SAMPLER_TYPE="probabilistic" \
            -e JAEGER_SAMPLER_PARAM="1" \
            agreatfool/dist_app_consumer:0.0.1

        docker logs -f app_consumer

    fi
}

function usage() {
    echo "Usage: run.sh web|service|consumer local|container"
}

if [[ $1 != "web" ]] && [[ $1 != "service" ]] && [[ $1 != "consumer" ]]; then
    usage
    exit 0
fi

eval $1 $2