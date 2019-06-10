#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function start() {
    rm -rf /private/tmp/prom-master.yaml
    cp ${BASEPATH}/prometheus/prom-master.yaml /private/tmp/prom-master.yaml
    rm -rf /private/tmp/prometheus/machine_xx1_node.yaml
    cp ${BASEPATH}/prometheus/machine_xx1_node.yaml /private/tmp/machine_xx1_node.yaml
    rm -rf /private/tmp/prometheus/machine_xx2_node.yaml
    cp ${BASEPATH}/prometheus/machine_xx2_node.yaml /private/tmp/machine_xx2_node.yaml

    docker-compose -f ${BASEPATH}/conf/dev/prometheus-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/dev/prometheus-cluster.yaml -p "dist" down -v # also remove containers & volumes
}

function logs() {
    docker logs $1
}

function node() {
    mkdir -p /private/tmp/logs
    rm -rf /private/tmp/logs/node_exporter.log
    touch /private/tmp/logs/node_exporter.log

    nohup ${BASEPATH}/prometheus/node_exporter \
        --no-collector.boottime \
        --no-collector.netdev \
        --no-collector.textfile \
        --no-collector.time > /private/tmp/logs/node_exporter.log&
    echo "node_exporter started"
}

function usage() {
    echo "Usage: docker_prometheus.sh start|stop|logs|node"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]] && [[ $1 != "node" ]]; then
    usage
    exit 0
fi

eval $1 $2
