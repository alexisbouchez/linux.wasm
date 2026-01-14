# Alpine Linux Integration Plan

## Overview

Integrate Alpine Linux distribution into the Linux/WASM kernel to provide a complete, minimal Linux environment in the browser.

## Strategy

### Phase 1: Root Filesystem Structure ✅
- [x] Create Alpine rootfs directory structure
- [x] Download Alpine minirootfs
- [x] Extract rootfs files
- [x] Create integration scripts

### Phase 2: Virtual Filesystem Integration
- [ ] Load Alpine rootfs into JavaScript virtual filesystem
- [ ] Map Alpine directories to virtual filesystem
- [ ] Handle binary files (compile to WASM or load as data)
- [ ] Support symlinks

### Phase 3: Binary Compilation
- [ ] Identify essential Alpine binaries
- [ ] Compile binaries to WASM using Emscripten
- [ ] Create WASM modules for each binary
- [ ] Handle musl libc dependencies

### Phase 4: Init System
- [ ] Set up BusyBox init or OpenRC
- [ ] Configure init scripts
- [ ] Launch from kernel init process
- [ ] Handle service startup

### Phase 5: Package Manager
- [ ] Implement apk functionality (or stub)
- [ ] Support package installation
- [ ] Handle package dependencies

## Essential Alpine Components

### Core Binaries
- `/bin/busybox` - Main binary with all utilities
- `/bin/sh` - Shell (symlink to busybox)
- `/sbin/init` - Init system
- `/bin/ash` - Almquist shell

### Libraries
- `/lib/ld-musl-x86_64.so.1` - musl libc dynamic linker
- `/lib/libc.musl-x86_64.so.1` - musl libc

### Configuration
- `/etc/passwd` - User database
- `/etc/group` - Group database
- `/etc/hosts` - Hostname resolution
- `/etc/resolv.conf` - DNS configuration
- `/etc/inittab` - Init configuration (if using sysvinit)

## Integration Steps

### 1. Extract Alpine Rootfs
```bash
cd alpine
curl -O https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-minirootfs-3.19.0-x86_64.tar.gz
tar -xzf alpine-minirootfs-3.19.0-x86_64.tar.gz -C rootfs
```

### 2. Create Rootfs JSON
```bash
node build/create_alpine_rootfs.js rootfs alpine_rootfs.json
```

### 3. Load into Virtual Filesystem
```javascript
const alpineData = await fetch('alpine/alpine_rootfs.json');
const alpineRootfs = await alpineData.json();
host.integrateAlpineRootfs(alpineRootfs);
```

### 4. Compile Binaries to WASM
```bash
# For each binary
emcc -o binary.wasm binary.c -s STANDALONE_WASM=1
```

## Challenges

1. **Binary Compatibility**: Alpine binaries are x86_64, need WASM versions
2. **Dynamic Linking**: musl libc needs to be linked properly
3. **Init System**: OpenRC is complex, BusyBox init is simpler
4. **Package Manager**: apk needs special handling for WASM

## Solutions

1. **Compile from Source**: Recompile Alpine packages with Emscripten
2. **Static Linking**: Use static linking to avoid dynamic libc issues
3. **BusyBox Init**: Use BusyBox's init (simpler than OpenRC)
4. **Stub apk**: Create JavaScript-based apk implementation

## Next Steps

1. ✅ Extract Alpine rootfs
2. Create rootfs JSON structure
3. Integrate into virtual filesystem
4. Test basic Alpine commands
5. Compile essential binaries to WASM
