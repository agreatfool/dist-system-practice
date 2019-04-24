#!/bin/bash

BASEDIR=$(dirname "$0")

PROMETHEUS_PORT=9090

function start_prometheus() {
    LISTEN="localhost:${PROMETHEUS_PORT}"
    nohup ${BASEDIR}/../../bin/prometheus/prometheus \
        --log.level=debug \
        --log.format=json \
        --web.listen-address="${LISTEN}" \
        --storage.tsdb.path="${BASEDIR}/data/$1/data" \
        --config.file=${BASEDIR}/conf/$1.yml >${BASEDIR}/log/$1.log&
    echo "prometheus $1 started: ${LISTEN}"
    ((PROMETHEUS_PORT=PROMETHEUS_PORT+1))
}

# start node_exporter
nohup ${BASEDIR}/../../bin/node_exporter \
    --no-collector.boottime \
    --no-collector.netdev \
    --no-collector.textfile \
    --no-collector.time >${BASEDIR}/log/node_exporter.log&
echo "node_exporter started"

# start prometheus federation nodes
start_prometheus node1
start_prometheus node2
start_prometheus node3

# start prometheus federation master
start_prometheus master

# start grafana
if [[ ! -d ${BASEDIR}/data/grafana/public ]]; then
  mkdir -p ${BASEDIR}/data/grafana
  cp -r ${BASEDIR}/../../bin/grafana/public ${BASEDIR}/data/grafana
fi
nohup ${BASEDIR}/../../bin/grafana/bin/grafana-server \
    --homepath "${BASEDIR}" >/dev/null&