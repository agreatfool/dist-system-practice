#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# see https://docs.datastax.com/en/archived/cassandra/2.1/cassandra/operations/ops_tune_jvm_c.html

MYSQL_USER="root" \
MYSQL_PWD="abc123_" \
MYSQL_DB="dist" \
MAX_WORK_ID=5000000 \
MEMCACHED_MEM="2048" \
KAFKA_JVM_MEM="512M" \
CAS_JVM_MEM="6G" \
CAS_HEAP_SIZE="4G" \
CAS_HEAP_NEWSIZE="800M" \
ES_JVM_MEM="512M" \
GRAFANA_USER="admin" \
GRAFANA_PWD="abc123_" \
HOST_IP_CLIENT="127.0.0.1" \
HOST_IP_STORAGE="127.0.0.1" \
HOST_IP_KAFKA_1="192.168.3.111" \
HOST_IP_KAFKA_2="192.168.3.111" \
HOST_IP_ES_1="192.168.3.111" \
HOST_IP_ES_2="192.168.3.111" \
HOST_IP_MONITOR="127.0.0.1" \
HOST_IP_WEB="127.0.0.1" \
HOST_IP_SERVICE="127.0.0.1" \
node build/index.js "$@"