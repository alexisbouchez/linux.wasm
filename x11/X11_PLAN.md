# X11 Support Implementation Plan

## Overview
Add X11 display server support to Linux WASM, enabling graphical applications like dwm, dmenu, and st.

## Architecture

### Browser-Based X11 Server
- JavaScript implementation of X11 protocol
- HTML5 Canvas for rendering
- WebGL for hardware acceleration (optional)
- Socket-like interface for X11 clients

### Components

1. **X11 Server (x11_server.js)**
   - X11 protocol parser/serializer
   - Display management
   - Window management
   - Event handling (keyboard, mouse)
   - Canvas rendering backend

2. **X11 Client Library**
   - Xlib/XCB compatibility layer
   - WASM-compiled X11 libraries
   - Connection to X11 server

3. **Applications**
   - dwm (window manager)
   - dmenu (application launcher)
   - st (simple terminal)

## Implementation Steps

### Phase 1: Basic X11 Server
- [x] X11 protocol basics (connection, authentication)
- [ ] Window creation and management
- [ ] Drawing primitives (pixels, lines, rectangles)
- [ ] Event system (keyboard, mouse, expose)
- [ ] Canvas rendering

### Phase 2: X11 Client Support
- [ ] Xlib compatibility layer
- [ ] XCB support
- [ ] Font rendering
- [ ] Image support (XPM, PNG)

### Phase 3: Applications
- [ ] Compile dwm to WASM
- [ ] Compile dmenu to WASM
- [ ] Compile st to WASM
- [ ] Integrate with shell

### Phase 4: Integration
- [ ] X11 socket in virtual filesystem
- [ ] DISPLAY environment variable
- [ ] Input event routing
- [ ] Window focus management

## Technical Details

### X11 Protocol
- Connection: TCP-like socket (virtual)
- Authentication: XAUTH or MIT-MAGIC-COOKIE-1
- Requests: Packets with opcode, length, data
- Events: Asynchronous messages from server

### Rendering
- Canvas 2D for basic rendering
- WebGL for performance (future)
- OffscreenCanvas for multi-window support

### Input
- Keyboard events → X11 KeyPress/KeyRelease
- Mouse events → X11 ButtonPress/ButtonRelease/MotionNotify
- Focus events → X11 FocusIn/FocusOut

## Files Structure
```
x11/
├── x11_server.js          # X11 server implementation
├── x11_protocol.js        # Protocol parsing/serialization
├── x11_canvas.js          # Canvas rendering backend
├── x11_events.js          # Event handling
├── x11_client.js          # Client library (Xlib compatibility)
└── apps/
    ├── dwm/               # dwm source and build
    ├── dmenu/             # dmenu source and build
    └── st/                # st source and build
```

## References
- X11 Protocol Specification
- Xlib Programming Manual
- dwm source code
- dmenu source code
- st source code
