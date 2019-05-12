#!/usr/bin/env bash

docker run --rm -d \
    --name memcached \
    -p 11211:11211 \
    memcached:1.5.14-alpine \
    memcached \
    -l "0.0.0.0" \
    -p 11211 \
    -m 64