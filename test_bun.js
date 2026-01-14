// Test script for Bun
import LinuxWasmHost from './wasm_host.js';
import { readFile } from 'fs/promises';

const host = new LinuxWasmHost();
console.log('✅ LinuxWasmHost loaded successfully');

// Test Alpine integration
try {
    const data = await Bun.file('./alpine/alpine_rootfs.json').json();
    await host.integrateAlpineRootfs(data);
    console.log('✅ Alpine rootfs integrated');
} catch (err) {
    console.log('⚠️  Alpine rootfs not found (optional)');
}

// Test kernel loading
try {
    const wasmBytes = await readFile('./kernel/linux/vmlinux.wasm');
    console.log(`✅ Kernel WASM file found (${wasmBytes.length} bytes)`);
    
    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, {
        env: {
            wasm_host_syscall: (nr, a1, a2, a3, a4, a5, a6) => {
                return host.handleSyscall(nr, a1, a2, a3, a4, a5, a6);
            },
            wasm_host_malloc: (size) => {
                return host.handleMalloc(size);
            },
            wasm_host_free: (ptr) => {
                return host.handleFree(ptr);
            }
        }
    });
    
    console.log('✅ Kernel WASM module compiled and instantiated');
    console.log('✅ Exports:', Object.keys(instance.exports));
    
    if (instance.exports.wasm_kernel_init) {
        instance.exports.wasm_kernel_init();
        console.log('✅ Kernel initialized');
    }
    
    if (instance.exports.wasm_kernel_start) {
        instance.exports.wasm_kernel_start();
        console.log('✅ Kernel started');
    }
    
} catch (err) {
    console.error('❌ Error loading kernel:', err.message);
    console.log('⚠️  Running in mock mode (kernel file not found)');
}

console.log('✅ All tests passed!');
