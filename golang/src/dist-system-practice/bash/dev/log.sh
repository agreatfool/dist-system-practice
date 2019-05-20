#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function web() {
    tail -f "/tmp/logs/app/app.web.stdout.log"
}

function service() {
    tail -f "/tmp/logs/app/app.service.stdout.log"
}

function consumer() {
    tail -f "/tmp/logs/app/app.consumer.stdout.log"
}

function usage() {
    echo "Usage: log.sh web|service|consumer"
}

if [[ $1 != "web" ]] && [[ $1 != "service" ]] && [[ $1 != "consumer" ]]; then
    usage
    exit 0
fi

eval $1