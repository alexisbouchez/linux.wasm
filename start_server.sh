#!/bin/bash
# Start HTTP server for Linux WASM testing

PORT=8000
cd "$(dirname "$0")"

# Check if server is already running
if [ -f /tmp/http_server.pid ]; then
    OLD_PID=$(cat /tmp/http_server.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "Server already running on port $PORT (PID: $OLD_PID)"
        LOCAL_IP=$(hostname -I | awk '{print $1}')
        echo ""
        echo "Access at: http://${LOCAL_IP}:${PORT}/test.html"
        exit 0
    fi
fi

# Start server
echo "Starting HTTP server on port $PORT..."
python3 -m http.server $PORT > /tmp/http_server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > /tmp/http_server.pid

sleep 1

# Check if server started
if ps -p $SERVER_PID > /dev/null 2>&1; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "✅ Server started successfully!"
    echo ""
    echo "Server PID: $SERVER_PID"
    echo "Port: $PORT"
    echo ""
    echo "Access URLs:"
    echo "  Local:    http://localhost:${PORT}/test.html"
    echo "  Network:  http://${LOCAL_IP}:${PORT}/test.html"
    echo ""
    echo "To stop: kill $SERVER_PID"
    echo "Or run: ./stop_server.sh"
else
    echo "❌ Failed to start server"
    cat /tmp/http_server.log
    exit 1
fi
