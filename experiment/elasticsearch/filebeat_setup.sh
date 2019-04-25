#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

function filebeat_setup() {
    FILEBEAT=${FULLPATH}/../bin/filebeat/filebeat

    ${FILEBEAT} setup \
        --path.config ${FULLPATH}/conf/filebeat \
        --path.data ${FULLPATH}/data/filebeat \
        --path.logs ${FULLPATH}/log/filebeat
}

filebeat_setup