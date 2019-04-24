#!/bin/bash -l

# ================================================================
# Idea from: https://gist.github.com/RobRuana/7cda375014e0f699fba1
# ================================================================

# ================================================================
# SELF MADE
# ================================================================
BASEDIR=$(dirname "$0")
cd ${BASEDIR}/../ # go to the root dir
cd golang # then go to golang dir
# ================================================================
# Set $GOPATH & $GOBIN & $GOROOT
export GOPATH=${PWD}
export GOBIN=${PWD}/bin
export GOROOT=/usr/local/Cellar/go/1.12/libexec # OSX brew
# ================================================================
# Go modules
export GO111MODULE=on # see: https://github.com/golang/go/wiki/Modules#how-to-install-and-activate-module-support
# ================================================================
cd ./src # go to src dir
# ================================================================

# Update command prompt to remind you which workspace you're using.
# This requires that your .bashrc looks for the $PROMPT_PREFIX variable
# export PROMPT_PREFIX="(go@`basename ${PWD}`)"

# Start a new bash shell to inherit $GOPATH
/bin/bash