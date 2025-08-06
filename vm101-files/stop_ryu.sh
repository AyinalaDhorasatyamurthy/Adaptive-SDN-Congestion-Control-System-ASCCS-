#!/bin/bash

# Kill any running Ryu manager processes
echo "Stopping Ryu controller..."
pkill -f ryu-manager
