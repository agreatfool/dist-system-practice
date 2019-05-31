#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

ES_1="http://127.0.0.1:9201"

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
    cp ${BASEPATH}/conf/dev/elasticsearch.yaml /private/tmp/
    cp ${BASEPATH}/conf/dev/filebeat.yaml /private/tmp/

    docker-compose -f ${BASEPATH}/conf/dev/elk-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/dev/elk-cluster.yaml -p "dist" down -v # also remove containers & volumes
}

function logs() {
    docker logs $1
}

function init() {
    curl \
        -H "Content-Type: application/json" \
        -PUT "${ES_1}/_template/dist?pretty" \
        -d @${BASEPATH}/conf/dev/elk-index-template.json
}

function health() {
    curl -X GET "${ES_1}/_cluster/health?pretty"
}

function cluster() {
    curl -X GET "${ES_1}/_cluster/state?pretty"
}

function cluster_human() {
    curl -X GET "${ES_1}/_cluster/stats?human&pretty"
}

function shards() {
    curl -X GET "${ES_1}/_cat/shards"
}

function node() {
    curl -X GET "${ES_1}/_nodes/$1/stats?pretty"
}

function node_index() {
    curl -X GET "${ES_1}/_nodes/stats/indices?pretty"
}

function templates() {
    curl -X GET "${ES_1}/_template/$1?pretty"
}

function usage() {
    echo "Usage: docker_elasticsearch.sh start|stop|logs|init|health|cluster|cluster_human|shards|node|node_index|templates"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]] && [[ $1 != "init" ]] && [[ $1 != "health" ]] && [[ $1 != "cluster" ]] && [[ $1 != "cluster_human" ]] && [[ $1 != "shards" ]] && [[ $1 != "node" ]] && [[ $1 != "node_index" ]] && [[ $1 != "templates" ]]; then
    usage
    exit 0
fi

eval $1 $2
