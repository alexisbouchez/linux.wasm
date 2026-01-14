# Linux WASM

Linux kernel and X11 desktop environment compiled to WebAssembly.

## Quick Start

Run everything at once:

```bash
./setup.sh && cd webapp && npm run dev
```

Then open **http://localhost:3000** in your browser.

Or step by step:

```bash
# 1. Setup and build
./setup.sh

# 2. Run webapp
cd webapp && npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

## Overview

This project compiles the Linux kernel and X11 applications (dwm, dmenu, st) to WebAssembly for browser execution.

## Structure

- `kernel/` - Linux kernel source and WASM build
- `x11/` - X11 server implementation and client applications
- `alpine/` - Alpine Linux root filesystem
- `webapp/` - Next.js web application
- `emsdk/` - Emscripten SDK

## X11 Applications

- `dwm.wasm` - Dynamic Window Manager (2.9K)
- `dmenu.wasm` - Application launcher (pending)
- `st.wasm` - Simple terminal (pending)

## Build

```bash
# Build all X11 apps
cd x11/apps
./build_dwm.sh
./build_dmenu.sh
./build_st.sh
```

## License

GPL-2.0
