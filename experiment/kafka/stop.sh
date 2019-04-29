#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

BIN_PATH=${FULLPATH}/../bin/kafka/bin

function stop_zookeeper() {
    PIDS=$(ps ax | grep java | grep -i QuorumPeerMain | grep -v grep | awk '{print $1}')
    if [[ -z "${PIDS}" ]]; then
      echo "No zookeeper server to stop"
      exit 1
    else
      kill -9 ${PIDS}
    fi
}

function stop_broker() {
    PIDS=$(ps ax | grep -i 'kafka\.Kafka' | grep java | grep -v grep | awk '{print $1}')
    if [[ -z "${PIDS}" ]]; then
      echo "No kafka server to stop"
      exit 1
    else
      kill -9 ${PIDS}
    fi
}

stop_zookeeper
stop_broker