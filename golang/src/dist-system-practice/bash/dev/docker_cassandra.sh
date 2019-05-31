#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# Elasticsearch:
# /usr/share/elasticsearch
# LICENSE.txt  NOTICE.txt  README.textile  bin  config  data  jdk  lib  logs  modules  plugins
# data
# logs/gc.log

function start() {
    docker-compose -f ${BASEPATH}/conf/cassandra-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/cassandra-cluster.yaml -p "dist" down -v # also remove containers & volumes
}

function logs() {
    docker logs $1
}

function usage() {
    echo "Usage: docker_cassandra.sh start|stop|logs"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]]; then
    usage
    exit 0
fi

eval $1 $2
