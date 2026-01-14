# Linux Kernel for WebAssembly

This project compiles the Linux kernel to WebAssembly (WASM) to run in a web browser.

## Status

✅ **Completed:**
- WASM architecture foundation (arch/wasm/)
- Build system integration with Emscripten
- Memory management for WASM linear memory
- Essential syscalls implementation (open, read, write, close)
- JavaScript host bindings interface
- Kernel compilation with Emscripten (200+ object files compiled)

⚠️ **In Progress:**
- Fixing remaining compilation errors
- Final linking and WASM binary generation

## Project Structure

```
linux.wasm/
├── kernel/linux/          # Linux kernel source
│   └── arch/wasm/         # WASM architecture implementation
├── build/wrappers/        # Emscripten tool wrappers
├── emsdk/                 # Emscripten SDK
├── wasm_host.js           # JavaScript host bindings
├── test.html              # Test page
└── TODO.txt              # Detailed project plan
```

## Building

1. **Setup Emscripten:**
```bash
source emsdk/emsdk_env.sh
export PATH=$PATH:$(pwd)/build/wrappers
```

2. **Configure kernel:**
```bash
cd kernel/linux
make ARCH=wasm defconfig
```

3. **Compile:**
```bash
make ARCH=wasm -j$(nproc)
```

## Architecture Implementation

The WASM architecture (`arch/wasm/`) includes:

- **Kernel entry point** (`kernel/entry.c`) - `wasm_kernel_start()`
- **Syscall handler** (`kernel/syscall.c`) - Translates Linux syscalls to WASM host calls
- **Memory management** (`mm/init.c`) - WASM linear memory initialization
- **Process management** (`kernel/process.c`) - Task switching
- **Time management** (`kernel/time.c`) - Jiffies and timing
- **Architecture headers** - Complete set of 30+ headers

## JavaScript Interface

The `wasm_host.js` file provides:

- **Memory management** - WebAssembly.Memory interface
- **System calls** - File operations (open, read, write, close)
- **Time functions** - Jiffies conversion
- **I/O** - Console output, file handling

## Usage

1. Load the compiled kernel WASM module
2. Initialize the host bindings
3. Start the kernel

See `test.html` for a complete example.

## Notes

- The kernel uses WASM linear memory (no traditional paging)
- System calls are translated to JavaScript host functions
- File operations are virtualized through the host interface
- Memory is limited by WASM constraints (currently 256MB-2GB)

## License

GPL-2.0 (Linux kernel license)
