/**
 * X11 Display Server for Linux WASM
 * 
 * Implements a basic X11 server in JavaScript that renders to HTML5 Canvas.
 * Supports X11 protocol for window management and rendering.
 */

class X11Server {
    constructor(canvasId = 'x11-canvas') {
        this.canvas = document.getElementById(canvasId) || this.createCanvas(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width = 1920;
        this.height = this.canvas.height = 1080;
        
        // X11 state
        this.displayNumber = 0;
        this.screenNumber = 0;
        this.windows = new Map();
        this.nextWindowId = 1;
        this.focusedWindow = null;
        this.rootWindow = null;
        
        // Clients
        this.clients = new Map();
        this.nextClientId = 1;
        
        // Resources
        this.pixmaps = new Map();
        this.gcs = new Map(); // Graphics contexts
        this.fonts = new Map();
        this.colormaps = new Map();
        
        // Event queue
        this.eventQueue = [];
        
        // Input state
        this.keyboardState = new Set();
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseButtons = 0;
        
        // Initialize root window
        this.initRootWindow();
        
        // Setup input handlers
        this.setupInputHandlers();
        
        console.log('[X11] Server initialized');
    }
    
    createCanvas(canvasId) {
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.style.border = '1px solid #333';
        canvas.style.background = '#000';
        document.body.appendChild(canvas);
        return canvas;
    }
    
    initRootWindow() {
        this.rootWindow = {
            id: 1,
            x: 0,
            y: 0,
            width: this.width,
            height: this.height,
            depth: 24,
            visual: 0,
            class: 1, // InputOutput
            mapState: 2, // Viewable
            background: 0x000000,
            border: 0x000000,
            children: [],
            parent: null,
            attributes: {
                backgroundPixel: 0x000000,
                borderPixel: 0x000000,
                bitGravity: 0,
                winGravity: 0,
                backingStore: 0,
                backingPlanes: 0xffffffff,
                backingPixel: 0,
                saveUnder: false,
                eventMask: 0,
                doNotPropagateMask: 0,
                overrideRedirect: false,
                colormap: 0,
                cursor: 0
            }
        };
        this.windows.set(1, this.rootWindow);
    }
    
    setupInputHandlers() {
        // Keyboard events
        this.canvas.addEventListener('keydown', (e) => {
            e.preventDefault();
            this.handleKeyPress(e);
        });
        
        this.canvas.addEventListener('keyup', (e) => {
            e.preventDefault();
            this.handleKeyRelease(e);
        });
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleButtonPress(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.handleButtonRelease(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.handleMotionNotify(e);
        });
        
        // Focus events
        this.canvas.addEventListener('focus', () => {
            this.handleFocusIn();
        });
        
        this.canvas.addEventListener('blur', () => {
            this.handleFocusOut();
        });
        
        // Make canvas focusable
        this.canvas.tabIndex = 0;
    }
    
    // X11 Protocol Methods
    
    /**
     * Create a new window
     */
    createWindow(parentId, x, y, width, height, depth, visual, class_, attributes) {
        const windowId = this.nextWindowId++;
        const parent = this.windows.get(parentId || 1);
        
        if (!parent) {
            throw new Error(`Parent window ${parentId} not found`);
        }
        
        const window = {
            id: windowId,
            x: x || 0,
            y: y || 0,
            width: width || 100,
            height: height || 100,
            depth: depth || parent.depth,
            visual: visual || parent.visual,
            class: class_ || 1, // InputOutput
            mapState: 0, // Unmapped
            background: attributes?.backgroundPixel || 0xffffff,
            border: attributes?.borderPixel || 0x000000,
            children: [],
            parent: parent,
            attributes: attributes || {},
            buffer: null // Canvas for double buffering
        };
        
        // Add to parent's children
        parent.children.push(windowId);
        this.windows.set(windowId, window);
        
        // Create offscreen canvas for window
        window.buffer = document.createElement('canvas');
        window.buffer.width = width || 100;
        window.buffer.height = height || 100;
        window.ctx = window.buffer.getContext('2d');
        
        // Fill background
        window.ctx.fillStyle = this.colorToCSS(window.background);
        window.ctx.fillRect(0, 0, window.width, window.height);
        
        console.log(`[X11] Created window ${windowId} (${width}x${height})`);
        
        return windowId;
    }
    
    /**
     * Map a window (make it visible)
     */
    mapWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) {
            throw new Error(`Window ${windowId} not found`);
        }
        
        window.mapState = 2; // Viewable
        this.render();
        
        // Send MapNotify event
        this.sendEvent(windowId, {
            type: 19, // MapNotify
            event: windowId,
            window: windowId,
            overrideRedirect: false
        });
        
        console.log(`[X11] Mapped window ${windowId}`);
    }
    
    /**
     * Unmap a window
     */
    unmapWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;
        
        window.mapState = 0; // Unmapped
        this.render();
        
        console.log(`[X11] Unmapped window ${windowId}`);
    }
    
    /**
     * Configure window (move, resize, etc.)
     */
    configureWindow(windowId, values) {
        const window = this.windows.get(windowId);
        if (!window) {
            throw new Error(`Window ${windowId} not found`);
        }
        
        if (values.x !== undefined) window.x = values.x;
        if (values.y !== undefined) window.y = values.y;
        if (values.width !== undefined) {
            window.width = values.width;
            window.buffer.width = values.width;
        }
        if (values.height !== undefined) {
            window.height = values.height;
            window.buffer.height = values.height;
        }
        if (values.borderWidth !== undefined) {
            window.borderWidth = values.borderWidth;
        }
        if (values.stackMode !== undefined) {
            // Handle stacking
        }
        
        this.render();
        
        // Send ConfigureNotify event
        this.sendEvent(windowId, {
            type: 22, // ConfigureNotify
            event: windowId,
            window: windowId,
            x: window.x,
            y: window.y,
            width: window.width,
            height: window.height,
            borderWidth: window.borderWidth || 0,
            aboveSibling: 0,
            overrideRedirect: false
        });
        
        console.log(`[X11] Configured window ${windowId}`);
    }
    
    /**
     * Draw pixels/rectangles
     */
    putImage(windowId, x, y, width, height, data, format) {
        const window = this.windows.get(windowId);
        if (!window || !window.buffer) return;
        
        if (format === 2) { // ZPixmap
            // Convert data to ImageData
            const imageData = window.ctx.createImageData(width, height);
            for (let i = 0; i < width * height; i++) {
                const offset = i * 4;
                // Assuming BGRA format
                imageData.data[offset] = data[i * 4 + 2];     // R
                imageData.data[offset + 1] = data[i * 4 + 1]; // G
                imageData.data[offset + 2] = data[i * 4];     // B
                imageData.data[offset + 3] = data[i * 4 + 3]; // A
            }
            window.ctx.putImageData(imageData, x, y);
        }
        
        this.render();
    }
    
    /**
     * Fill rectangle
     */
    fillRectangle(windowId, x, y, width, height, color) {
        const window = this.windows.get(windowId);
        if (!window || !window.buffer) return;
        
        window.ctx.fillStyle = this.colorToCSS(color);
        window.ctx.fillRect(x, y, width, height);
        
        this.render();
    }
    
    /**
     * Draw text
     */
    drawText(windowId, x, y, text, font, color) {
        const window = this.windows.get(windowId);
        if (!window || !window.buffer) return;
        
        window.ctx.fillStyle = this.colorToCSS(color);
        window.ctx.font = font || '12px monospace';
        window.ctx.fillText(text, x, y);
        
        this.render();
    }
    
    /**
     * Render all windows to main canvas
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render windows in stacking order
        const windows = Array.from(this.windows.values())
            .filter(w => w.mapState === 2 && w.id !== 1) // Viewable, not root
            .sort((a, b) => {
                // Simple stacking: children after parents
                return a.id - b.id;
            });
        
        for (const window of windows) {
            if (window.buffer) {
                this.ctx.drawImage(window.buffer, window.x, window.y);
            }
        }
    }
    
    // Event Handling
    
    handleKeyPress(event) {
        const keycode = this.keyToKeycode(event.key, event.code);
        this.keyboardState.add(keycode);
        
        if (this.focusedWindow) {
            this.sendEvent(this.focusedWindow, {
                type: 2, // KeyPress
                detail: keycode,
                time: Date.now(),
                root: 1,
                event: this.focusedWindow,
                child: 0,
                rootX: this.mouseX,
                rootY: this.mouseY,
                eventX: this.mouseX - this.windows.get(this.focusedWindow).x,
                eventY: this.mouseY - this.windows.get(this.focusedWindow).y,
                state: Array.from(this.keyboardState).reduce((a, b) => a | (1 << b), 0),
                sameScreen: true
            });
        }
    }
    
    handleKeyRelease(event) {
        const keycode = this.keyToKeycode(event.key, event.code);
        this.keyboardState.delete(keycode);
        
        if (this.focusedWindow) {
            this.sendEvent(this.focusedWindow, {
                type: 3, // KeyRelease
                detail: keycode,
                time: Date.now(),
                root: 1,
                event: this.focusedWindow,
                child: 0,
                rootX: this.mouseX,
                rootY: this.mouseY,
                eventX: this.mouseX - this.windows.get(this.focusedWindow).x,
                eventY: this.mouseY - this.windows.get(this.focusedWindow).y,
                state: Array.from(this.keyboardState).reduce((a, b) => a | (1 << b), 0),
                sameScreen: true
            });
        }
    }
    
    handleButtonPress(event) {
        const button = event.button + 1; // X11 buttons are 1-indexed
        this.mouseButtons |= (1 << button);
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        
        // Find window under mouse
        const window = this.findWindowAt(this.mouseX, this.mouseY);
        if (window) {
            this.focusWindow(window.id);
            this.sendEvent(window.id, {
                type: 4, // ButtonPress
                detail: button,
                time: Date.now(),
                root: 1,
                event: window.id,
                child: 0,
                rootX: this.mouseX,
                rootY: this.mouseY,
                eventX: this.mouseX - window.x,
                eventY: this.mouseY - window.y,
                state: this.mouseButtons,
                sameScreen: true
            });
        }
    }
    
    handleButtonRelease(event) {
        const button = event.button + 1;
        this.mouseButtons &= ~(1 << button);
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        
        if (this.focusedWindow) {
            this.sendEvent(this.focusedWindow, {
                type: 5, // ButtonRelease
                detail: button,
                time: Date.now(),
                root: 1,
                event: this.focusedWindow,
                child: 0,
                rootX: this.mouseX,
                rootY: this.mouseY,
                eventX: this.mouseX - this.windows.get(this.focusedWindow).x,
                eventY: this.mouseY - this.windows.get(this.focusedWindow).y,
                state: this.mouseButtons,
                sameScreen: true
            });
        }
    }
    
    handleMotionNotify(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        
        if (this.focusedWindow) {
            this.sendEvent(this.focusedWindow, {
                type: 6, // MotionNotify
                detail: 0, // Normal
                time: Date.now(),
                root: 1,
                event: this.focusedWindow,
                child: 0,
                rootX: this.mouseX,
                rootY: this.mouseY,
                eventX: this.mouseX - this.windows.get(this.focusedWindow).x,
                eventY: this.mouseY - this.windows.get(this.focusedWindow).y,
                state: this.mouseButtons,
                sameScreen: true
            });
        }
    }
    
    handleFocusIn() {
        if (this.focusedWindow) {
            this.sendEvent(this.focusedWindow, {
                type: 9, // FocusIn
                detail: 0, // Normal
                event: this.focusedWindow,
                mode: 0 // Normal
            });
        }
    }
    
    handleFocusOut() {
        if (this.focusedWindow) {
            this.sendEvent(this.focusedWindow, {
                type: 10, // FocusOut
                detail: 0, // Normal
                event: this.focusedWindow,
                mode: 0 // Normal
            });
        }
    }
    
    focusWindow(windowId) {
        this.focusedWindow = windowId;
    }
    
    findWindowAt(x, y) {
        // Find topmost window at coordinates
        const windows = Array.from(this.windows.values())
            .filter(w => w.mapState === 2 && w.id !== 1)
            .reverse(); // Check from top to bottom
        
        for (const window of windows) {
            if (x >= window.x && x < window.x + window.width &&
                y >= window.y && y < window.y + window.height) {
                return window;
            }
        }
        
        return this.rootWindow;
    }
    
    sendEvent(windowId, event) {
        // Queue event for the window's client
        const window = this.windows.get(windowId);
        if (window && window.clientId) {
            if (!this.eventQueue[window.clientId]) {
                this.eventQueue[window.clientId] = [];
            }
            this.eventQueue[window.clientId].push(event);
        }
    }
    
    // Utility methods
    
    keyToKeycode(key, code) {
        // Simple keycode mapping (X11 keycodes are 8-255)
        const keyMap = {
            'Escape': 9,
            'Enter': 36,
            'Space': 65,
            'Backspace': 22,
            'Tab': 23,
            'ArrowLeft': 113,
            'ArrowRight': 114,
            'ArrowUp': 111,
            'ArrowDown': 116
        };
        
        if (keyMap[key]) return keyMap[key];
        
        // Map ASCII to keycodes
        if (key.length === 1) {
            const charCode = key.charCodeAt(0);
            if (charCode >= 65 && charCode <= 90) { // A-Z
                return charCode - 65 + 38; // X11 keycodes for letters
            }
            if (charCode >= 97 && charCode <= 122) { // a-z
                return charCode - 97 + 38;
            }
        }
        
        return 0; // Unknown
    }
    
    colorToCSS(color) {
        // Convert X11 color (24-bit RGB) to CSS
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Get display string for clients
     */
    getDisplayString() {
        return `:${this.displayNumber}.${this.screenNumber}`;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = X11Server;
}
export default X11Server;
