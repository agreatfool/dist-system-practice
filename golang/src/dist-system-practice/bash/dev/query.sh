#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

function api() {
    curl -v "http://127.0.0.1:8000/api"
}

function work() {
    curl -v "http://127.0.0.1:8000/work"
}

function viewed() {
    curl -v "http://127.0.0.1:8000/viewed"
}

function achievement() {
    curl -v "http://127.0.0.1:8000/achievement"
}

function plan() {
    curl -v "http://127.0.0.1:8000/plan"
}

function usage() {
    echo "Usage: query.sh api|work|viewed|achievement|plan"
}

if [[ $1 != "api" ]] && [[ $1 != "work" ]] && [[ $1 != "viewed" ]] && [[ $1 != "achievement" ]] && [[ $1 != "plan" ]]; then
    usage
    exit 0
fi

eval $1