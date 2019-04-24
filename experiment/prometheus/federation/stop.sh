#!/bin/bash

kill -9 $(pgrep -lfa "node_exporter" | awk '{print $1}')
kill -9 $(pgrep -lfa "prometheus" | awk '{print $1}')
kill -9 $(pgrep -lfa "grafana" | awk '{print $1}')