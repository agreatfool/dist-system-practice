#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# /usr/share/elasticsearch
# LICENSE.txt  NOTICE.txt  README.textile  bin  config  data  jdk  lib  logs  modules  plugins
# data
# logs/gc.log

function start() {
    echo "start"
}

function stop() {
    echo "stop"
}

function usage() {
    echo "Usage: docker_elasticsearch.sh start|stop"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]]; then
    usage
    exit 0
fi

eval $1
