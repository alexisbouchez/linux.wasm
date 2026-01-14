# Linux WASM

Linux kernel and X11 desktop environment compiled to WebAssembly.

## Quick Start

Run everything at once:

```bash
# Setup and run
./setup.sh
```

Or manually:

```bash
# 1. Setup Emscripten
source emsdk/emsdk_env.sh

# 2. Build X11 apps
cd x11/apps
./build_dwm.sh

# 3. Setup webapp
cd ../../webapp
npm install

# 4. Run
npm run dev
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
# Build dwm
cd x11/apps
./build_dwm.sh
```

## License

GPL-2.0
