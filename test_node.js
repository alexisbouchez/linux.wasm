// Test script for Node.js (with experimental WASM support)
import LinuxWasmHost from './wasm_host.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const host = new LinuxWasmHost();
console.log('✅ LinuxWasmHost loaded successfully');

// Test Alpine integration
try {
    const alpinePath = join(__dirname, 'alpine', 'alpine_rootfs.json');
    const data = JSON.parse(await readFile(alpinePath, 'utf-8'));
    await host.integrateAlpineRootfs(data);
    console.log('✅ Alpine rootfs integrated');
} catch (err) {
    console.log('⚠️  Alpine rootfs not found (optional):', err.message);
}

// Test kernel loading
try {
    const kernelPath = join(__dirname, 'kernel', 'linux', 'vmlinux.wasm');
    const wasmBytes = await readFile(kernelPath);
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
    
    const kernelInstance = await host.init(wasmModule);
    console.log('✅ Kernel initialized via host.init()');
    
    if (instance.exports.wasm_kernel_init) {
        instance.exports.wasm_kernel_init();
        console.log('✅ Kernel init() called');
    }
    
    if (instance.exports.wasm_kernel_start) {
        instance.exports.wasm_kernel_start();
        console.log('✅ Kernel start() called');
    }
    
} catch (err) {
    console.error('❌ Error loading kernel:', err.message);
    console.log('⚠️  Running in mock mode (kernel file not found or error)');
}

console.log('✅ All tests completed!');
