#!/usr/bin/env bash

function start() {
    docker run --rm -d \
        --name memcached \
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
    echo "Usage: docker_memcached.sh start|stop"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]]; then
    usage
    exit 0
fi

eval $1
