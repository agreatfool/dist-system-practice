#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

# IMAGE
cd ${FULLPATH}/httpserver
docker build -t http-test:0.1.0 .
cd ..

# NETWORK
docker network create \
    -d bridge \
    envoy-test-net

# CONTAINER
# NODE1
docker run --rm -it -d \
    --name node1 \
    --network=envoy-test-net \
    -p 8098:8098 \
    http-test:0.1.0

# NODE2
docker run --rm -it -d \
    --name node2 \
    --network=envoy-test-net \
    -e "PORT=8099" \
    -p 8099:8099 \
    http-test:0.1.0

# ENVOY
docker run --rm -it -d \
    --name envoy-test \
    --network=envoy-test-net \
    -p 9901:9901 \
    -p 9988:9988 \
    -v ${FULLPATH}/conf:/etc/envoy \
    -v ${FULLPATH}/log:/tmp \
    envoyproxy/envoy:v1.10.0

sleep 2

curl -v "http://127.0.0.1:9988"