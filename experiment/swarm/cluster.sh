#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}"

#        --engine-registry-mirror https://index.docker.io/v1/ \
function create() {
    docker-machine create -d virtualbox \
        --virtualbox-boot2docker-url ~/.docker/machine/cache/boot2docker.iso \
        --virtualbox-hostonly-cidr "192.168.99.1/24" \
        --engine-opt dns=192.168.99.1 \
        host1

    docker-machine create -d virtualbox \
        --virtualbox-boot2docker-url ~/.docker/machine/cache/boot2docker.iso \
        --virtualbox-hostonly-cidr "192.168.99.1/24" \
        --engine-opt dns=192.168.99.1 \
        host2
}

function remove() {
    docker-machine rm host1
    docker-machine rm host2
}

function swarm_init() {
    docker-machine ssh host1 "docker swarm init --advertise-addr 192.168.99.114"
}

function swarm_join() {
    if [[ $1 == "" ]]; then
        echo "token required"
        exit 0
    fi

    docker-machine ssh host2 "docker swarm join --token $1 192.168.99.114:2377"
}

function swarm_leave() {
    if [[ $1 == "" ]]; then
        echo "node name required"
        exit 0
    fi

    # use 'docker swarm leave --force' if leader node
    docker-machine ssh $1 "docker swarm leave --force"
}

function swarm_list() {
    docker-machine ssh host1 "docker node ls"
}

function service_start() {
    eval "$(docker-machine env host1)"

    docker network create -d overlay --attachable dist_net

    docker service create \
        --name memcached \
        --network dist_net \
        --replicas 1 \
        -p 11211:11211 \
        --constraint node.hostname==host1 \
        memcached:1.5.14-alpine \
        -l 0.0.0.0 \
        -p 11211 \
        -m 64

    docker service create \
        --name memcache_admin \
        --network dist_net \
        --replicas 1 \
        -p 9083:9083 \
        --constraint node.hostname==host2 \
        -e MEMCACHE_HOST=memcached \
        -e MEMCACHE_PORT=11211 \
        plopix/docker-memcacheadmin:latest

#    docker stack deploy --with-registry-auth -c ${BASEPATH}/cluster.yaml dist

    eval "$(docker-machine env -u)"
}

function service_list() {
    echo "docker-machine ssh v \"docker service ls\""
    docker-machine ssh host1 "docker service ls"
    echo ""

    echo "docker-machine ssh host1 \"docker stack ps dist\""
    docker-machine ssh host1 "docker stack ps dist"
}

function service_stop() {
    eval "$(docker-machine env host1)"

    docker service rm memcached
    docker service rm memcache_admin

#    docker stack rm dist

    eval "$(docker-machine env -u)"
}

function service_log() {
    if [[ $1 == "" ]]; then
        echo "service name required"
        exit 0
    fi

    docker-machine ssh host1 "docker service logs $1"
}

function usage() {
    echo "Usage: cluster.sh create|swarm_init|swarm_join|swarm_list|run|service_list|service_log"
}

if [[ $1 != "create" ]] && [[ $1 != "remove" ]] && [[ $1 != "swarm_init" ]] && [[ $1 != "swarm_join" ]] && [[ $1 != "swarm_leave" ]] && [[ $1 != "swarm_list" ]] && [[ $1 != "service_start" ]] && [[ $1 != "service_list" ]] && [[ $1 != "service_stop" ]] && [[ $1 != "service_log" ]]; then
    usage
    exit 0
fi

eval $1 $2