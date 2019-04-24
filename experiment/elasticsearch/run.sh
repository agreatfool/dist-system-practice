#!/usr/bin/env bash

BASEDIR=$(dirname "$0")

function start_nginx() {
    if [[ ! "$(docker ps -q -f name=nginx)" ]]; then
        # nginx container exists
        if [[ "$(docker ps -aq -f status=exited -f name=nginx)" ]]; then
            # status exited, restart it
            docker start nginx
        fi
        # do nothing with running status
    else
        # nginx container does not exist, create it
        docker run -d --name nginx \
            -p 8080:80 \
            -v ${BASEDIR}/nginx/log:/var/log/nginx \
            -v ${BASEDIR}/nginx/html:/usr/share/nginx/html \
            nginx:1.16.0-alpine
    fi
}

ES_PATH_CONF=/path/to/my/config ./bin/elasticsearch
