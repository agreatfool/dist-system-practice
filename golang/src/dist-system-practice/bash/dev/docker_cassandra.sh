#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# Cassandra:
# /etc/cassandra
# cassandra-env.sh  cassandra-topology.properties  commitlog_archiving.properties  jvm.options  logback.xml
# cassandra-rackdc.properties  cassandra.yaml  hotspot_compiler  logback-tools.xml triggers

# /var/lib/cassandra
# commitlog  data  hints  saved_caches

# /var/log/cassandra
# debug.log  gc.log.0.current  system.log

# /usr/share/cassandra
# apache-cassandra-3.11.4.jar  apache-cassandra-thrift-3.11.4.jar  apache-cassandra.jar  cassandra.in.sh  lib  stress.jar

function start() {
    docker-compose -f ${BASEPATH}/conf/dev/cassandra-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/dev/cassandra-cluster.yaml -p "dist" down -v # also remove containers & volumes
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
