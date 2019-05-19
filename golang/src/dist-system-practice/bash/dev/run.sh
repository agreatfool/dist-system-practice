#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function web() {
    cd ${BASEPATH}/web

    APP_NAME="app.web" \
    LOGGER_CONF_PATH="${BASEPATH}/conf/logger.yaml" \
    WEB_HOST="127.0.0.1" \
    WEB_PORT="8000" \
    MAX_WORK_ID="1" \
    RPC_CONF_PATH="${BASEPATH}/conf/rpc.yaml" \
    go run web.go
}

function service() {
    cd ${BASEPATH}/service

    APP_NAME="app.service" \
    LOGGER_CONF_PATH="${BASEPATH}/conf/logger.yaml" \
    CACHE_CONF_PATH="${BASEPATH}/conf/cache.yaml" \
    MYSQL_CONF_PATH="${BASEPATH}/conf/mysql.yaml" \
    SERVICE_HOST="127.0.0.1" \
    SERVICE_PORT="16241" \
    KAFKA_BROKERS='["127.0.0.1:19092","127.0.0.1:29092","127.0.0.1:39092"]' \
    go run service.go
}

function consumer() {
    cd ${BASEPATH}/consumer

    APP_NAME="app.service" \
    LOGGER_CONF_PATH="${BASEPATH}/conf/logger.yaml" \
    CACHE_CONF_PATH="${BASEPATH}/conf/cache.yaml" \
    MYSQL_CONF_PATH="${BASEPATH}/conf/mysql.yaml" \
    CONSUMER_ROUTINES="3" \
    CONSUMER_FACTOR="37" \
    KAFKA_BROKERS='["127.0.0.1:19092","127.0.0.1:29092","127.0.0.1:39092"]' \
    go run service.go
}

function usage() {
    echo "Usage: run.sh web|service|consumer"
}

if [[ $1 != "web" ]] && [[ $1 != "service" ]] && [[ $1 != "consumer" ]]; then
    usage
    exit 0
fi

eval $1