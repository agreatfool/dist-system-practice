#!/usr/bin/env bash

pkill -f elasticsearch
pkill -f kibana
pkill -f filebeat

docker stop nginx