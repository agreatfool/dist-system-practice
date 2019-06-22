#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

MYSQL_USER="root"
MYSQL_PWD="abc123_"
MYSQL_DB="dist"
MEMCACHED_MEM="2048" # MB
