#!/bin/bash
set -o pipefail
set -e

# Check that a script file was provided
if [ -z "$1" ]; then
  echo "Please provide a script file to execute as the first argument"
  exit 1
fi

# Execute the script with all extra arguments and log its output
if [ -z "$NO_PINO" ]; then
  echo "Running script: $1 ${@:2} with pino-pretty, set NO_PINO=1 to disable prettify"
  npx ts-node --swc -r tsconfig-paths/register --transpile-only $1 "${@:2}" | npx pino-pretty
else
  echo "Running script: $1 ${@:2}"
  npx ts-node --swc -r tsconfig-paths/register --transpile-only $1 "${@:2}"
fi
