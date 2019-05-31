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

function init() {
    docker run --rm \
        --name jaeger-cassandra-schema \
        --network dist_net \
        -e MODE=test \
        -e CQLSH_HOST=cas_1 \
        -e DATACENTER=jaeger_dc \
        -e KEYSPACE=jaeger_keyspace \
        jaegertracing/jaeger-cassandra-schema:1.11.0
}

function usage() {
    echo "Usage: docker_cassandra.sh start|stop|logs|init"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]] && [[ $1 != "init" ]]; then
    usage
    exit 0
fi

eval $1 $2
