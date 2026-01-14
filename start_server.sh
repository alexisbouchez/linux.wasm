#!/bin/bash
# Start HTTP server for Linux WASM testing

PORT=8000
cd "$(dirname "$0")"

# Kill existing server if running
if [ -f /tmp/http_server.pid ]; then
    OLD_PID=$(cat /tmp/http_server.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        kill $OLD_PID 2>/dev/null
        sleep 1
    fi
fi

# Start server binding to all interfaces
echo "Starting HTTP server on port $PORT (binding to 0.0.0.0)..."
python3 -m http.server $PORT --bind 0.0.0.0 > /tmp/http_server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > /tmp/http_server.pid

sleep 2

# Check if server started
if ps -p $SERVER_PID > /dev/null 2>&1; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "✅ Server started successfully!"
    echo ""
    echo "Server PID: $SERVER_PID"
    echo "Port: $PORT"
    echo "Binding: 0.0.0.0 (all interfaces)"
    echo ""
    echo "Access URLs:"
    echo "  Local:    http://localhost:${PORT}/test.html"
    echo "  Network:  http://${LOCAL_IP}:${PORT}/test.html"
    echo ""
    echo "To allow from network, run: sudo ufw allow 8000/tcp"
    echo "To stop: kill $SERVER_PID or ./stop_server.sh"
else
    echo "❌ Failed to start server"
    cat /tmp/http_server.log
    exit 1
fi
