#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function start() {
    docker-compose -f ${BASEPATH}/conf/dev/jaeger-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/dev/jaeger-cluster.yaml -p "dist" down -v # also remove containers & volumes
}

function logs() {
    docker logs $1
}

function usage() {
    echo "Usage: docker_jaeger.sh start|stop|logs"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]]; then
    usage
    exit 0
fi

eval $1 $2
