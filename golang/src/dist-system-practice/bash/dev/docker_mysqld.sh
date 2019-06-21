#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

DBNAME=dist
USER=root
PASSWORD=abc123

# mysql
# /docker-entrypoint-initdb.d
# *.sql
# /etc/mysql/conf.d
# docker.cnf  mysql.cnf  mysqldump.cnf
# /var/lib/mysql
# db data
# /var/log/mysql

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

    docker network create dist_net

    docker run --rm -d \
        --name mysqld \
        --network=dist_net \
        -e MYSQL_DATABASE=${DBNAME} \
        -e MYSQL_ROOT_PASSWORD=${PASSWORD} \
        -p 3306:3306 \
        -v ${BASEPATH}/schema:/docker-entrypoint-initdb.d \
        -v mysqld_data:/var/lib/mysql \
        mysql:5.7.26

    exporter
}

function connect() {
    docker run --rm -it \
        --network dist_net \
        mysql:5.7.26 \
        mysql -hmysqld -u${USER} -p${PASSWORD}
}

function stop() {
    docker stop mysqld-exporter
    docker stop mysqld
}

function clear() {
    # rm -rf ${BASEPATH}/mysql/conf/* # this is optional
    rm -rf ${BASEPATH}/mysql/data/*
    rm -rf ${BASEPATH}/mysql/log/*
}

function exporter() {
    docker run --rm -d \
        --name mysqld-exporter \
        --network=dist_net \
        -p 9104:9104 \
        -e DATA_SOURCE_NAME="${USER}:${PASSWORD}@tcp(mysqld:3306)/${DBNAME}?charset=utf8mb4&collation=utf8mb4_general_ci&parseTime=true&loc=Local" \
        prom/mysqld-exporter:v0.11.0 \
        --collect.binlog_size \
        --collect.info_schema.processlist \
        --collect.info_schema.innodb_cmp \
        --collect.info_schema.innodb_cmpmem \
        --collect.engine_innodb_status \
        --collect.info_schema.innodb_metrics \
        --collect.info_schema.innodb_tablespaces \
        --collect.perf_schema.eventsstatements \
        --collect.perf_schema.eventswaits \
        --collect.perf_schema.file_events \
        --collect.perf_schema.file_instances \
        --collect.perf_schema.indexiowaits \
        --collect.perf_schema.tablelocks \
        --collect.perf_schema.tableiowaits
}

function usage() {
    echo "Usage: docker_mysqld.sh start|connect|stop|clear|exporter"
}

if [[ $1 != "start" ]] && [[ $1 != "connect" ]] && [[ $1 != "stop" ]] && [[ $1 != "clear" ]] && [[ $1 != "exporter" ]]; then
    usage
    exit 0
fi

eval $1
