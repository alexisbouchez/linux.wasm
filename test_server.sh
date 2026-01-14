#!/bin/bash
# Simple HTTP server for testing Linux/WASM in browser
echo "Starting HTTP server on http://localhost:8000"
echo "Open http://localhost:8000/test.html in your browser"
python3 -m http.server 8000
