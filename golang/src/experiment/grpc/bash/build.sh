#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/.."

protoc \
    --go_out=plugins=grpc:${BASEPATH}/message \
    -I ${BASEPATH}/proto \
    ${BASEPATH}/proto/book.proto