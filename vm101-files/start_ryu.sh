#!/bin/bash

# Activate the Python virtual environment for Ryu
source ~/ryu-env/bin/activate

# Start the Ryu controller with your 3 apps
ryu-manager forwarding_app.py qos_app.py my_monitoring_app.py 
reroute_app.py
