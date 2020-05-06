#!/usr/bin/env bash
set -e

for ((i = 0; i < 30; i++)); do /opt/node-v10.20.1-linux-x64/bin/node race-timeout.js; done
for ((i = 0; i < 30; i++)); do /opt/node-v12.0.0-linux-x64/bin/node race-timeout.js; done
