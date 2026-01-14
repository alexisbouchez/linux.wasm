# Alpine Linux Integration for WASM

## Overview

This directory contains the Alpine Linux distribution integration for the Linux/WASM kernel.

## Goals

1. Create a minimal Alpine Linux root filesystem
2. Compile Alpine packages to WASM
3. Integrate with the virtual filesystem
4. Set up Alpine's init system (OpenRC or BusyBox init)
5. Provide Alpine's package manager (apk) functionality

## Alpine Linux Characteristics

- **libc**: musl (lightweight, WASM-friendly)
- **Init**: OpenRC or BusyBox init
- **Package Manager**: apk
- **Base System**: BusyBox utilities
- **Size**: Very small (~5MB base system)

## Structure

```
alpine/
├── rootfs/          # Root filesystem structure
│   ├── bin/         # Essential binaries
│   ├── sbin/        # System binaries
│   ├── etc/         # Configuration files
│   ├── usr/         # User programs
│   ├── lib/         # Libraries (musl)
│   ├── var/         # Variable data
│   └── proc/        # Proc filesystem mount point
├── packages/        # Alpine packages (apk files)
├── build/           # Build scripts and tools
└── README.md        # This file
```

## Integration Strategy

1. **Virtual Filesystem Integration**
   - Mount Alpine rootfs into our virtual filesystem
   - Map Alpine directories to JavaScript Map structure
   - Support Alpine's directory layout

2. **Binary Compilation**
   - Compile Alpine packages to WASM using Emscripten
   - Use musl libc (already WASM-compatible)
   - Create WASM modules for each binary

3. **Init System**
   - Use BusyBox init (simpler than OpenRC for WASM)
   - Or implement minimal OpenRC
   - Launch from kernel's init process

4. **Package Manager**
   - Implement apk functionality in JavaScript
   - Or use pre-compiled packages
   - Support package installation/removal

## Next Steps

1. Download Alpine Linux rootfs
2. Extract essential binaries
3. Compile to WASM
4. Integrate with virtual filesystem
5. Test boot sequence
