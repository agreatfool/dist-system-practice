#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function start() {
    docker-compose \
        -f ${BASEPATH}/conf/kafka.yaml \
        -p kafka-cluster \
        up \
            -d \
            --scale kafka=3
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/kafka.yaml down # also remove containers
}

function usage() {
    echo "Usage: docker_kafka.sh start|stop"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]]; then
    usage
    exit 0
fi

eval $1
