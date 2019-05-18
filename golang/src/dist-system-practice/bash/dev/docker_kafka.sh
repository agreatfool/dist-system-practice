#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

KAFKA_LOCAL_BIN_PATH="${BASEPATH}/../../../experiment/bin/kafka/bin"
TOPIC_NAME="work-topic"
ZOOKEEPER="127.0.0.1:2181"
BOOTSTRAP_SERVER="127.0.0.1:9092"
BROKER_LIST="127.0.0.1:9092,127.0.0.1:9093,127.0.0.1:9094"

function start() {
    docker-compose -f ${BASEPATH}/conf/kafka.yaml up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/kafka.yaml down # also remove containers
}

function topic() {
    echo "Topic info display:"
    ${KAFKA_LOCAL_BIN_PATH}/kafka-topics.sh \
        --describe \
        --zookeeper ${ZOOKEEPER} \
        --topic ${TOPIC_NAME}

    echo "Create ${TOPIC_NAME} messages from source: ${BASEPATH}/kafka/messages.txt"
    ${KAFKA_LOCAL_BIN_PATH}/kafka-console-producer.sh \
        --broker-list ${BROKER_LIST} \
        --property "parse.key=true" \
        --property "key.separator=:" \
        --topic ${TOPIC_NAME} < ${BASEPATH}/kafka/messages.txt
    echo ""

    echo "Read ${TOPIC_NAME} message:"
    ${KAFKA_LOCAL_BIN_PATH}/kafka-console-consumer.sh \
        --bootstrap-server ${BOOTSTRAP_SERVER} \
        --from-beginning \
        --max-messages 6 \
        --topic ${TOPIC_NAME}
}

function usage() {
    echo "Usage: docker_kafka.sh start|stop"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "topic" ]]; then
    usage
    exit 0
fi

eval $1
