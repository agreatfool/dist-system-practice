#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# Elasticsearch:
# /usr/share/elasticsearch
# LICENSE.txt  NOTICE.txt  README.textile  bin  config  data  jdk  lib  logs  modules  plugins
# data
# logs/gc.log

# Kibana:
# /usr/share/kibana
# LICENSE.txt  README.txt  built_assets  data  node_modules  package.json  src  webpackShims
# NOTICE.txt   bin  config  node  optimize   plugins target

# Filebeat:
# LICENSE.txt  README.md fields.yml  filebeat.reference.yml  kibana  module
# NOTICE.txt   data filebeat    filebeat.yml    logs    modules.d
# Config path: [/usr/share/filebeat] Data path: [/usr/share/filebeat/data] Logs path: [/usr/share/filebeat/logs]

function start() {
    cp ${BASEPATH}/conf/elasticsearch.yaml /private/tmp/elasticsearch.yaml
    cp ${BASEPATH}/conf/filebeat.yaml /private/tmp/filebeat.yaml

    docker-compose -f ${BASEPATH}/conf/elk-cluster.yaml -p "elk" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/elk-cluster.yaml -p "elk" down -v # also remove containers & volumes
}

function logs() {
    docker logs $1
}

function health() {
    curl -X GET "http://127.0.0.1:9201/_cluster/health?pretty"
}

function cluster() {
    curl -X GET "http://127.0.0.1:9201/_cluster/state?pretty"
}

function cluster_human() {
    curl -X GET "http://127.0.0.1:9201/_cluster/stats?human&pretty"
}

function node() {
    curl -X GET "http://127.0.0.1:9201/_nodes/$1/stats?pretty"
}

function index() {
    curl -X GET "http://127.0.0.1:9201/_nodes/stats/indices?pretty"
}

function usage() {
    echo "Usage: docker_elasticsearch.sh start|stop|logs|health|cluster|cluster_human|node|index"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]] && [[ $1 != "health" ]] && [[ $1 != "cluster" ]] && [[ $1 != "cluster_human" ]] && [[ $1 != "node" ]] && [[ $1 != "index" ]]; then
    usage
    exit 0
fi

eval $1 $2
