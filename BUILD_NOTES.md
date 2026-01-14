# Linux/WASM Build Notes

## Current Status

We've made significant progress on creating the WASM architecture for Linux kernel, but hit a major challenge with the build system.

## Completed Work

1. **Architecture Foundation**: Complete `arch/wasm/` directory structure
2. **Kernel Configuration**: Created `wasm_defconfig` with minimal config
3. **Architecture Headers**: Created 15+ essential headers
4. **Build System**: Created Makefile, Kconfig, Kconfig.debug

## Major Challenge: Build System Toolchain

The Linux kernel build system expects a traditional GCC toolchain:
- `gcc` / `g++`
- `ld` (GNU linker)
- `ar` (archive tool)
- `nm`, `objcopy`, `objdump`, `strip`

Emscripten provides:
- `emcc` / `em++` (compiler)
- `emcc` (also acts as linker)
- `emar` (archive tool)
- LLVM tools (`llvm-nm`, `llvm-objcopy`, etc.)

The kernel's `scripts/Kconfig.include` checks for linker support and rejects `emcc` as a linker.

## Potential Solutions

### Option 1: Create Wrapper Scripts
Create scripts that make Emscripten tools look like GCC tools:
```bash
#!/bin/bash
# gcc-wrapper.sh
exec emcc "$@"
```

### Option 2: Modify Kernel Build System
Patch `scripts/Kconfig.include` to recognize Emscripten as valid toolchain.

### Option 3: Two-Stage Build
1. Compile kernel objects with a compatible compiler (or modified build)
2. Link final WASM module with Emscripten

### Option 4: Use Alternative Approach
- Compile individual source files to WASM objects
- Use custom linker script
- Bypass kernel build system for final linking

## Next Steps

1. Create wrapper scripts for Emscripten tools
2. Test if kernel build system accepts wrappers
3. Continue fixing compilation errors as they appear
4. Implement missing architecture-specific code
5. Complete memory management implementation
6. Implement essential syscalls

## Files Created

See TODO.txt for complete list. Key files:
- `arch/wasm/Kconfig` - Architecture registration
- `arch/wasm/Makefile` - Build configuration
- `arch/wasm/kernel/entry.c` - Kernel entry point
- `arch/wasm/kernel/syscall.c` - Syscall framework
- `arch/wasm/configs/wasm_defconfig` - Minimal config
- 15+ architecture headers
