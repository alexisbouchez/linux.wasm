#!/bin/bash
# Stop HTTP server

if [ -f /tmp/http_server.pid ]; then
    PID=$(cat /tmp/http_server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✅ Server stopped (PID: $PID)"
        rm /tmp/http_server.pid
    else
        echo "Server not running"
        rm /tmp/http_server.pid
    fi
else
    echo "No server PID file found"
fi
