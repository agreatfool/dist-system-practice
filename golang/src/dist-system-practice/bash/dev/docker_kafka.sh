#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

KAFKA_LOCAL_BIN_PATH="${BASEPATH}/../../../experiment/bin/kafka/bin"
TOPIC_NAME="work-topic"
ZOOKEEPER="127.0.0.1:2181"
BOOTSTRAP_SERVER="192.168.3.111:19092"
#BROKER_LIST="192.168.3.111:19092,192.168.3.111:29092,192.168.3.111:39092"
BROKER_LIST="192.168.3.111:19092"

function start() {
    rm -rf /private/tmp/jmx_prometheus_javaagent-0.9.jar
    cp ${BASEPATH}/kafka/jmx_prometheus_javaagent-0.9.jar /private/tmp/jmx_prometheus_javaagent-0.9.jar
    rm -rf /private/tmp/jmx-kafka-2_0_0.yaml
    cp ${BASEPATH}/kafka/jmx-kafka-2_0_0.yaml /private/tmp/jmx-kafka-2_0_0.yaml

    docker-compose -f ${BASEPATH}/conf/dev/kafka-cluster.yaml -p "dist" up -d
}

function stop() {
    docker-compose -f ${BASEPATH}/conf/dev/kafka-cluster.yaml -p "dist" down -v # also remove containers & volumes
}

function logs() {
    docker logs $1
}

#../../../experiment/bin/kafka/bin/kafka-topics.sh --describe --zookeeper 127.0.0.1:2181 --topic "work-topic"
#../../../experiment/bin/kafka/bin/kafka-console-producer.sh --broker-list 127.0.0.1:19092 --topic "work-topic"
#../../../experiment/bin/kafka/bin/kafka-console-consumer.sh --bootstrap-server 127.0.0.1:19092 --topic "work-topic" --from-beginning

# the working directory in container is "/opt/kafka"
# $ ls /opt/kafka
# LICENSE    NOTICE     bin        config     libs       logs       site-docs

function init() {
    ${KAFKA_LOCAL_BIN_PATH}/kafka-topics.sh \
        --create \
        --bootstrap-server ${BOOTSTRAP_SERVER} \
        --replication-factor 1 \
        --partitions 1 \
        --topic ${TOPIC_NAME}
    echo "Topic created: ${TOPIC_NAME}"

    echo "Topic info display:"
    ${KAFKA_LOCAL_BIN_PATH}/kafka-topics.sh \
        --describe \
        --zookeeper ${ZOOKEEPER} \
        --topic ${TOPIC_NAME}
}

function topic() {
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
    echo "Usage: docker_kafka.sh start|stop|logs|init|topic"
}

if [[ $1 != "start" ]] && [[ $1 != "stop" ]] && [[ $1 != "logs" ]] && [[ $1 != "init" ]] && [[ $1 != "topic" ]]; then
    usage
    exit 0
fi

eval $1 $2
