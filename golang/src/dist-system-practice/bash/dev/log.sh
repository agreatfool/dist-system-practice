#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

LOG_WEB="/tmp/logs/app/app.web.stdout.log"
LOG_SERVICE="/tmp/logs/app/app.service.stdout.log"
LOG_CONSUMER="/tmp/logs/app/app.consumer.stdout.log"

function web() {
    tail -f ${LOG_WEB}
}

function service() {
    tail -f ${LOG_SERVICE}
}

function consumer() {
    tail -f ${LOG_CONSUMER}
}

function reset() {
    mkdir -p /tmp/logs/app

    rm ${LOG_WEB}
    touch ${LOG_WEB}
    rm ${LOG_SERVICE}
    touch ${LOG_SERVICE}
    rm ${LOG_CONSUMER}
    touch ${LOG_CONSUMER}
}

function usage() {
    echo "Usage: log.sh web|service|consumer|reset"
}

if [[ $1 != "web" ]] && [[ $1 != "service" ]] && [[ $1 != "consumer" ]] && [[ $1 != "reset" ]]; then
    usage
    exit 0
fi

eval $1