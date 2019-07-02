#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}"

# brew install vegeta --verbose

function nginx() {
    mkdir -p ${BASEPATH}/tmp

    docker network create vegeta

    docker run --rm -d \
        --name nginx \
        --network vegeta \
        -p 8099:80 \
        --expose 80 \
        nginx:1.16.0-alpine
}

function vegeta() {
    docker run --rm -i \
        --network vegeta \
        -v ${BASEPATH}/tmp:/tmp \
        peterevans/vegeta:6.5.0 sh -c \
        "echo \"GET http://nginx\" | vegeta attack -connections=10000 -duration=30s -rate=10/s -timeout=30s -workers=1000 | tee /tmp/results.bin | vegeta report --every=1s"
}

function clean() {
    docker stop nginx; \
    docker network rm vegeta; \
    rm -rf ${BASEPATH}/tmp
}

function usage() {
    echo "Usage: vegeta.sh nginx|vegeta|clean"
}

if [[ $1 != "nginx" ]] && [[ $1 != "vegeta" ]] && [[ $1 != "clean" ]]; then
    usage
    exit 0
fi

eval $1 $2