#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"

rm -rf /private/tmp/zookeeper
rm -rf ${FULLPATH}/data
rm -rf ${FULLPATH}/log
