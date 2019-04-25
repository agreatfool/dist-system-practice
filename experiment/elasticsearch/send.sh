#!/usr/bin/env bash

while [[ 1 ]]
do
    curl --silent http://localhost:8080 > /dev/null
    echo "sent"
    sleep 1
done