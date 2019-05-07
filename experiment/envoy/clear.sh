#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

docker stop envoy-test
docker stop node1
docker stop node2
docker rmi http-test:0.1.0
docker network rm envoy-test-net

rm ${FULLPATH}/log/access.log
rm ${FULLPATH}/log/admin_access.log
