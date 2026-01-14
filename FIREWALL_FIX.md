# Firewall Configuration for HTTP Server

## Problem
If you get `ERR_ADDRESS_UNREACHABLE` when accessing from another device, the firewall is blocking the connection.

## Solution

Run these commands to allow port 8000:

```bash
sudo ufw allow 8000/tcp
sudo ufw reload
```

## Verify

Check if the rule was added:
```bash
sudo ufw status | grep 8000
```

You should see:
```
8000/tcp                   ALLOW       Anywhere
```

## Alternative: Check if UFW is enabled

```bash
sudo ufw status
```

If UFW is inactive, you may need to enable it first:
```bash
sudo ufw enable
sudo ufw allow 8000/tcp
```

## Test After Fixing

1. From the server machine: `curl http://localhost:8000/test.html` (should work)
2. From another device: Open `http://192.168.1.24:8000/test.html` in browser

## If Still Not Working

Check if there are other firewalls:
```bash
sudo iptables -L -n | grep 8000
```

Or check if the server is actually accessible:
```bash
# From another device on the network, try:
ping 192.168.1.24
```

