#!/usr/bin/env bash

FULLPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BASEPATH="${FULLPATH}/../.."

# proxy
export http_proxy=http://127.0.0.1:6152
export https_proxy=http://127.0.0.1:6152

# golang env
export GOPATH="${BASEPATH}/../.."
export GOBIN="${GOPATH}/bin"
export GOROOT="/usr/local/Cellar/go/1.12/libexec" # OSX brew
export GO111MODULE=on # see: https://github.com/golang/go/wiki/Modules#how-to-install-and-activate-module-support

# version
VERSION=v0.1.2

# download lib
go get -u github.com/trustpilot/beat-exporter@${VERSION}

# build
cd ${BASEPATH}/../../pkg/mod/github.com/trustpilot/beat-exporter@${VERSION}

docker build \
    --no-cache \
    --tag agreatfool/beat-exporter:${VERSION} \
    --build-arg http_proxy=http://192.168.3.111:6152 \
    --build-arg https_proxy=http://192.168.3.111:6152 \
    --file ./Dockerfile \
    .