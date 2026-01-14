# HTTP Server for Linux WASM Testing

## Server Status

✅ **Server is running on port 8000**

## Access URLs

### From this machine:
```
http://localhost:8000/test.html
```

### From other devices on your local network:
```
http://192.168.1.24:8000/test.html
```

## Firewall Configuration

To allow access from other devices on your network, run:

```bash
sudo ufw allow 8000/tcp
```

Then verify:
```bash
sudo ufw status | grep 8000
```

## Server Management

### Start Server
```bash
./start_server.sh
```

### Stop Server
```bash
./stop_server.sh
```

Or manually:
```bash
kill $(cat /tmp/http_server.pid)
```

## Current Server Info

- **Port**: 8000
- **PID**: $(cat /tmp/http_server.pid 2>/dev/null || echo "N/A")
- **Local IP**: 192.168.1.24
- **Status**: Running

## Testing

1. Open browser to: `http://192.168.1.24:8000/test.html`
2. The Linux WASM kernel should load automatically
3. You can interact with the shell through the terminal interface

## Troubleshooting

If you can't access from other devices:
1. Check firewall: `sudo ufw status`
2. Check server is running: `ps aux | grep "http.server"`
3. Check port is listening: `netstat -tlnp | grep 8000`
4. Verify local IP: `hostname -I`
