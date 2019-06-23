#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# MYSQL
MYSQL_USER="root"
MYSQL_PWD="abc123_"
MYSQL_DB="dist"
MEMCACHED_MEM="2048" # MB

# KAFKA
KAFKA_JVM_MEM="6G"

# CASSANDRA
CAS_JVM_MEM="6G"
CAS_HEAP_SIZE="4G"
CAS_HEAP_NEWSIZE="800M" # see https://docs.datastax.com/en/archived/cassandra/2.1/cassandra/operations/ops_tune_jvm_c.html

# ELASTICSEARCH
ES_JVM_MEM="6G"

# PROMETHEUS
GRAFANA_USER="admin"
GRAFANA_PWD="abc123_"

function usage() {
    echo "Usage: cluster.sh web|service|consumer|reset"
}

if [[ $1 != "web" ]] && [[ $1 != "service" ]] && [[ $1 != "consumer" ]] && [[ $1 != "reset" ]]; then
    usage
    exit 0
fi

eval $1