#!/bin/bash

cd $(dirname ${0})

while true; do
        (cd ~/publish && ./Cutpilot) &
        wait
        pkill BTracker
        sleep 5
done
