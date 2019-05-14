#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH=${FULLPATH}/../..

DBNAME=dist
USER=root
PASSWORD=abc123

function start() {
    # remove any files in data dir
    # data dir have to be empty when mysql starting, otherwise error would be encountered
    #
    # e.g
    # Initializing database
    # 2019-05-12T19:08:08.026511Z 0 [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).
    # 2019-05-12T19:08:08.031314Z 0 [ERROR] --initialize specified but the data directory has files in it. Aborting.
    # 2019-05-12T19:08:08.031370Z 0 [ERROR] Aborting
    rm -rf ${BASEPATH}/mysql/data/*
    rm -rf ${BASEPATH}/mysql/log/*

    docker network create mysqld-net

    docker run --rm -d \
        --name mysqld \
        --network=mysqld-net \
        -e MYSQL_DATABASE=${DBNAME} \
        -e MYSQL_ROOT_PASSWORD=${PASSWORD} \
        -p 3306:3306 \
        -v ${BASEPATH}/schema:/docker-entrypoint-initdb.d \
        -v ${BASEPATH}/mysql/conf:/etc/mysql/conf.d \
        -v ${BASEPATH}/mysql/data:/var/lib/mysql \
        -v ${BASEPATH}/mysql/log:/var/log/mysql \
        mysql:5.7.26
}

function connect() {
    docker run --rm -it \
        --network mysqld-net \
        mysql:5.7.26 \
        mysql -hmysqld -u${USER} -p${PASSWORD}
}

function stop() {
    docker stop mysqld
}

function clear() {
    docker network rm mysqld-net

    # rm -rf ${BASEPATH}/mysql/conf/* # this is optional
    rm -rf ${BASEPATH}/mysql/data/*
    rm -rf ${BASEPATH}/mysql/log/*
}

function usage() {
    echo "Usage: docker_mysqld.sh start|connect|stop|clear"
}

if [[ $1 != "start" ]] && [[ $1 != "connect" ]] && [[ $1 != "stop" ]] && [[ $1 != "clear" ]]; then
    usage
    exit 0
fi

eval $1
