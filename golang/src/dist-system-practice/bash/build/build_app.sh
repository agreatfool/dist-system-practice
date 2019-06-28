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

# workdir
cd ${BASEPATH}/../ # golang/src
# ls -l
# drwxr-xr-x  19 ...  staff  608  6 20 10:47 dist-system-practice
# drwxr-xr-x  12 ...  staff  384  5 18 21:10 experiment

function build() {
    if [[ $1 != "web" ]] && [[ $1 != "service" ]] && [[ $1 != "consumer" ]]; then
        usage
        exit 0
    fi
    if [[ $2 != "local" ]] && [[ $2 != "container" ]]; then
        usage
        exit 0
    fi

    if [[ $2 == "local" ]]; then
        cd dist-system-practice/$1
        go build $1.go
    elif [[ $2 == "container" ]]; then
        docker build \
            --no-cache \
            --tag agreatfool/dist_app_$1:0.0.2 \
            --build-arg http_proxy=http://192.168.3.111:6152 \
            --build-arg https_proxy=http://192.168.3.111:6152 \
            --file ${BASEPATH}/bash/build/Dockerfile_$1 \
            .
    fi
}

function usage() {
    echo "Usage: build_app.sh web|service|consumer local|container"
}

build $1 $2