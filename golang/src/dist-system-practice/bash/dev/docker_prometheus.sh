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
    cp ${BASEPATH}/conf/dev/prometheus/prom-master.yaml /private/tmp/prom-master.yaml
    rm -rf /private/tmp/machines
    cp -R ${BASEPATH}/conf/dev/prometheus/machines /private/tmp/machines
    rm -rf /private/tmp/grafana
    cp -R ${BASEPATH}/vendors/prometheus/grafana /private/tmp/grafana
    cp ${BASEPATH}/conf/dev/grafana/grafana.ini /private/tmp/grafana

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

    nohup ${BASEPATH}/vendors/prometheus/bin/node_exporter > /private/tmp/logs/node_exporter.log&
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
