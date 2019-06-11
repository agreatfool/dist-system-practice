#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# prometheus
# /bin/prometheus
# /prometheus/data
# /etc/prometheus
# console_libraries  consoles  prometheus.yml
# /usr/share/prometheus
# console_libraries  consoles

# grafana
# /etc/grafana
# grafana.ini  ldap.toml  provisioning
# /etc/grafana/provisioning
# dashboards  datasources  notifiers
# /var/lib/grafana
# grafana.db  plugins  png
# /var/log/grafana
# /usr/share/grafana
# LICENSE  NOTICE.md  README.md  VERSION  bin  conf  public  scripts  tools

function start() {
    rm -rf /private/tmp/prom-master.yaml
    cp ${BASEPATH}/prometheus/prom-master.yaml /private/tmp/prom-master.yaml
    rm -rf /private/tmp/prometheus/machine_xx1_node.yaml
    cp ${BASEPATH}/prometheus/machine_xx1_node.yaml /private/tmp/machine_xx1_node.yaml
    rm -rf /private/tmp/prometheus/machine_xx2_node.yaml
    cp ${BASEPATH}/prometheus/machine_xx2_node.yaml /private/tmp/machine_xx2_node.yaml
    rm -rf /private/tmp/grafana.ini
    cp ${BASEPATH}/prometheus/grafana.ini /private/tmp/grafana.ini

    node

    docker-compose -f ${BASEPATH}/conf/dev/prometheus-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/dev/prometheus-cluster.yaml -p "dist" down -v # also remove containers & volumes

    kill -9 $(pgrep -lfa "node_exporter" | awk '{print $1}')
}

function logs() {
    docker logs $1
}

function node() {
    mkdir -p /private/tmp/logs
    rm -rf /private/tmp/logs/node_exporter.log
    touch /private/tmp/logs/node_exporter.log

    kill -9 $(pgrep -lfa "node_exporter" | awk '{print $1}')

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
