#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

rm -rf ${FULLPATH}/data/*
rm -rf ${FULLPATH}/log/*

NGINX_ACCESS=${FULLPATH}/nginx/log/access.log
NGINX_ERROR=${FULLPATH}/nginx/log/error.log

if [[ -f ${NGINX_ACCESS} ]]; then
    > ${NGINX_ACCESS}
fi
if [[ -f ${NGINX_ERROR} ]]; then
    > ${NGINX_ERROR}
fi