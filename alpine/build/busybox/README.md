# BusyBox WASM Build

## Status

BusyBox has been compiled to WASM using Emscripten.

## Build Process

1. Download BusyBox 1.36.1 source
2. Configure with `defconfig`
3. Build with Emscripten:
   ```bash
   CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make
   ```

## Output

- `busybox.wasm` - Compiled BusyBox binary in WASM format
- Located in `alpine/packages/busybox.wasm`

## Integration

The compiled BusyBox can be:
1. Loaded as a WASM module in the browser
2. Executed via `execve()` syscall
3. Used to replace JavaScript-based BusyBox applets

## Usage

```javascript
// Load BusyBox WASM module
const response = await fetch('alpine/packages/busybox.wasm');
const bytes = await response.arrayBuffer();
const module = await WebAssembly.compile(bytes);
const instance = await WebAssembly.instantiate(module, imports);

// Execute BusyBox applet
// BusyBox determines applet by argv[0]
```

## Notes

- Networking features disabled (not available in WASM)
- Filesystem features disabled (using virtual filesystem)
- Core utilities enabled (ls, cat, echo, etc.)
- Shell (ash) enabled
- Init system enabled
