#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# jaeger-agent:

# jaeger-collector:

# jaeger-query:

function start() {
    # Use the same project name "elk" as elasticsearch cluster,
    # since jaeger using es as the data store.
    # They need to be put in the same network.
    docker-compose -f ${BASEPATH}/conf/jaeger-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/jaeger-cluster.yaml -p "dist" down -v # also remove containers & volumes
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
