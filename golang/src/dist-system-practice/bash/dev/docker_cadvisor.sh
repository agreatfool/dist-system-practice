#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function start() {
    docker network create dist_net

    docker run --rm -d \
        --name=cadvisor \
        --network=dist_net \
        -v /:/rootfs:ro \
        -v /var/run:/var/run:rw \
        -v /sys:/sys:ro \
        -v /var/lib/docker/:/var/lib/docker:ro \
        -p 28080:28080 \
        google/cadvisor:v0.33.0 \
        --listen_ip=0.0.0.0 \
        --port=28080
}

function stop() {
    docker stop cadvisor
}

function logs() {
    docker logs $1
}

function usage() {
    echo "Usage: docker_cadvisor.sh start|stop|logs"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]]; then
    usage
    exit 0
fi

eval $1 $2
