#!/bin/bash

cd $(dirname ${0})

sudo rm -rf publishgotracker.tmp
sudo rm -rf publishgotracker.old
sudo mkdir publishgotracker.tmp
sudo tar xf publish_aws.tar -C publishgotracker.tmp

sudo mv publishgotracker publishgotracker.old
sudo mv publishgotracker.tmp publishgotracker

# Define the Node.js server port
NODEJS_PORT=1888

# Function to stop the Node.js server
stop_nodejs_server() {
  NODEJS_PID=$(lsof -t -i:${NODEJS_PORT})
  if [[ -n $NODEJS_PID ]]; then
    echo "Stopping Node.js server (PID: $NODEJS_PID)"
    kill -9 $NODEJS_PID
  else
    echo "Node.js server is not running."
  fi
}

# Start the Node.js server
sudo nohup node publishgotracker/program.js > /dev/null 2>&1 &

echo "Node.js server started."

# Stop the Node.js server
stop_nodejs_server
