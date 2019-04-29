#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

BIN_PATH=${FULLPATH}/../bin/kafka/bin

ZOOKEEPER_PORT=2181
ZOOKEEPER_ADDR="localhost:${ZOOKEEPER_PORT}"

BROKER_ID=0
BROKER_PORT=9092
BROKER_LIST="localhost:9092,localhost:9093,localhost:9094"

TOPIC_NAME="my-test-topic"

function start_zookeeper() {
    LOGFILE=${FULLPATH}/log/zookeeper/zookeeper.log

    if [[ ! -f ${LOGFILE} ]]; then
        mkdir -p "$(dirname ${LOGFILE})"
        touch ${LOGFILE}
    fi
    if [[ ! -f ${FULLPATH}/data ]]; then
        mkdir -p ${FULLPATH}/data
    fi

    nohup ${BIN_PATH}/zookeeper-server-start.sh \
        ${FULLPATH}/conf/zookeeper.properties >${LOGFILE}&

    echo "Zookeeper started"
    echo "Link zookeeper data dir: '/private/tmp/zookeeper'"
    ln -s /private/tmp/zookeeper ${FULLPATH}/data/zookeeper
}

function start_broker() {
    ${BIN_PATH}/kafka-server-start.sh -daemon \
        ${FULLPATH}/conf/server${BROKER_ID}.properties \
        --override broker.id=${BROKER_ID} \
        --override listeners=PLAINTEXT://:${BROKER_PORT} \
        --override log.dirs=${FULLPATH}/data/server${BROKER_ID} \
        --override zookeeper.connect=${ZOOKEEPER_ADDR}

    echo "Kafka Broker started: ID: ${BROKER_ID}, PORT: ${BROKER_PORT}"

    ((BROKER_ID=BROKER_ID+1))
    ((BROKER_PORT=BROKER_PORT+1))
}

function create_topic() {
    ${BIN_PATH}/kafka-topics.sh \
        --create \
        --bootstrap-server "localhost:9092" \
        --replication-factor 3 \
        --partitions 3 \
        --topic ${TOPIC_NAME}
    echo "Topic created: ${TOPIC_NAME}"

    echo "Topic info display:"
    ${BIN_PATH}/kafka-topics.sh \
        --describe \
        --bootstrap-server "localhost:9092" \
        --topic ${TOPIC_NAME}
}

function create_messages() {
    echo "Create ${TOPIC_NAME} messages from source: ${FULLPATH}/messages.txt"
    ${BIN_PATH}/kafka-console-producer.sh \
        --broker-list ${BROKER_LIST} \
        --property "parse.key=true" \
        --property "key.separator=:" \
        --topic ${TOPIC_NAME} < ${FULLPATH}/messages.txt
    echo ""
}

function get_messages() {
    echo "Read ${TOPIC_NAME} messages:"
    ${BIN_PATH}/kafka-console-consumer.sh \
        --bootstrap-server "localhost:9092" \
        --from-beginning \
        --max-messages 6 \
        --topic ${TOPIC_NAME}
}

# start zookeeper
start_zookeeper

sleep 2

# start kafka brokers, 3 brokers, each topic has 3 partitions, each partition has 3 replicas
start_broker
start_broker
start_broker

sleep 10

# create topic
create_topic

# send messages
create_messages

# read messages
get_messages