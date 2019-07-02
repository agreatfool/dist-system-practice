#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# see https://docs.datastax.com/en/archived/cassandra/2.1/cassandra/operations/ops_tune_jvm_c.html

MYSQL_USER="root" \
MYSQL_PWD="4E3Gd0F0Eokf576P" \
MYSQL_DB="dist" \
MYSQL_CONN_NUM="900" \
MAX_WORK_ID="5000000" \
MEMCACHED_MEM="512" \
KAFKA_JVM_MEM="512M" \
KAFKA_TOPIC="work-topic" \
KAFKA_PARTITIONS="20" \
CAS_JVM_MEM="1G" \
CAS_HEAP_SIZE="768M" \
CAS_HEAP_NEWSIZE="512M" \
ES_JVM_MEM="512M" \
GRAFANA_USER="admin" \
GRAFANA_PWD="4E3Gd0F0Eokf576P" \
CONSUMER_FACTOR="37" \
HOST_IP_CLIENT="45.33.33.252" \
HOST_IP_STORAGE="45.33.37.94" \
HOST_IP_KAFKA_1="45.56.82.40" \
HOST_IP_KAFKA_2="45.33.62.105" \
HOST_IP_ES_1="45.33.50.175" \
HOST_IP_ES_2="104.237.152.232" \
HOST_IP_MONITOR="45.33.40.165" \
HOST_IP_WEB="45.79.94.148" \
HOST_IP_SERVICE="192.81.133.128" \
node build/index.js "$@"