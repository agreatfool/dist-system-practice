#!/usr/bin/env bash

function start() {
    docker run --rm -d \
        --name memcached-admin \
        --network=memcached-net \
        -e MEMCACHE_HOST=memcached \
        -e MEMCACHE_PORT=11211 \
        -p 9083:9083 \
        plopix/docker-memcacheadmin:latest
}

function stop() {
    docker stop memcached-admin
}

function usage() {
    echo "Usage: docker_memcached_admin.sh start|stop"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]]; then
    usage
    exit 0
fi

eval $1
