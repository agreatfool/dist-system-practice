#!/usr/bin/env bash

function start() {
    docker network create dist_net

    docker run --rm -d \
        --name memcached \
        --network=dist_net \
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

function exporter() {
    docker run --rm -d \
        --name memcached-exporter \
        --network=dist_net \
        -p 9150:9150 \
        prom/memcached-exporter:v0.5.0 \
        --memcached.address=memcached:11211
}

function usage() {
    echo "Usage: docker_memcached.sh start|stop|exporter"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "exporter" ]]; then
    usage
    exit 0
fi

eval $1
