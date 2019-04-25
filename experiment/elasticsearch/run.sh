#!/usr/bin/env bash

BASEDIR=$(dirname "$0")
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

#ES_PATH_CONF=/path/to/my/config ./bin/elasticsearch

start_nginx