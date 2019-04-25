#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

function start_nginx() {
    if [[ "$(docker ps -aq -f status=exited -f name=nginx)" ]]; then
        # status exited, restart it
        echo "Nginx container status exited, restarting"
        docker start nginx
        return 0
    fi

    if [[ "$(docker ps -aq -f status=running -f name=nginx)" ]]; then
        # running status, ok
        echo "Nginx container status running, ok"
        return 0
    fi

    # nginx container does not exist, create it
    echo "Nginx container not found, creating"
    docker run -d --name nginx \
        -p 8080:80 \
        -v ${FULLPATH}/nginx/log:/var/log/nginx \
        -v ${FULLPATH}/nginx/html:/usr/share/nginx/html \
        nginx:1.16.0-alpine
    docker ps -a

    return 0
}

function start_elasticsearch() {
    ELSTICSEARCH=${FULLPATH}/../bin/elasticsearch/bin/elasticsearch

    ES_PATH_CONF=${FULLPATH}/conf/elasticsearch ${ELSTICSEARCH} \
        -d \
        -E discovery.type=single-node \
        -E path.data=${FULLPATH}/data/elasticsearch \
        -E path.logs=${FULLPATH}/log/elasticsearch \
        -E cluster.routing.allocation.disk.threshold_enabled=false
}

function start_kibana() {
    KIBANA=${FULLPATH}/../bin/kibana/bin/kibana
    LOGFILE=${FULLPATH}/log/kibana/kibana.log

    if [[ ! -f ${LOGFILE} ]]; then
        mkdir -p "$(dirname ${LOGFILE})"
        touch ${LOGFILE}
    fi

    export CONFIG_PATH=${FULLPATH}/conf/kibana/kibana.yml
    nohup ${KIBANA} >${LOGFILE}&
}

function start_filebeat() {
    FILEBEAT=${FULLPATH}/../bin/filebeat/filebeat

    nohup ${FILEBEAT} run \
        --path.config ${FULLPATH}/conf/filebeat \
        --path.data ${FULLPATH}/data/filebeat \
        --path.logs ${FULLPATH}/log/filebeat >/dev/null&
}

#start_nginx
#start_elasticsearch
#start_kibana
#start_filebeat

