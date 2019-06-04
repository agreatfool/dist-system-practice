#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function volumes() {
    docker volume rm $(docker volume ls -f "dangling=true" -q)
}

function usage() {
    echo "Usage: clear.sh volumes"
}

if [[ $1 != "volumes" ]]; then
    usage
    exit 0
fi

eval $1