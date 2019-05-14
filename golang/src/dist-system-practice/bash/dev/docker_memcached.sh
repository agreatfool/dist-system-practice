#!/usr/bin/env bash

function start() {
    docker network create memcached-net

    docker run --rm -d \
        --name memcached \
        --network=memcached-net \
        -p 11211:11211 \
        memcached:1.5.14-alpine \
        memcached \
        -l "0.0.0.0" \
        -p 11211 \
        -m 64
}

function stop() {
    docker stop memcached
}

function usage() {
    echo "Usage: docker_memcached.sh start|stop|clear"
}

function clear() {
    docker network rm memcached-net
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "clear" ]]; then
    usage
    exit 0
fi

eval $1
