# SCP Download Instructions

## Quick Copy (Essential Files Only)

Copy just the files needed to run the Linux WASM kernel:

```bash
# Create local directory
mkdir -p ~/linux.wasm

# Copy essential files
scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/test.html ~/linux.wasm/
scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/wasm_host.js ~/linux.wasm/
scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/kernel/linux/vmlinux.wasm ~/linux.wasm/
scp -r alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/alpine/alpine_rootfs.json ~/linux.wasm/alpine/ 2>/dev/null || mkdir -p ~/linux.wasm/alpine && scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/alpine/alpine_rootfs.json ~/linux.wasm/alpine/
```

## Full Directory Copy

Copy the entire directory (large, includes build artifacts):

```bash
scp -r alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm ~/
```

## Exclude Large Build Artifacts

Copy everything except kernel source and build files:

```bash
rsync -avz --exclude='kernel/linux' --exclude='.git' --exclude='*.o' --exclude='*.a' alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/ ~/linux.wasm/
```

## Recommended: Minimal Copy

Just the files needed to run in browser:

```bash
mkdir -p ~/linux.wasm
cd ~/linux.wasm

# Main files
scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/test.html .
scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/wasm_host.js .

# Kernel WASM
mkdir -p kernel/linux
scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/kernel/linux/vmlinux.wasm kernel/linux/

# Alpine rootfs (optional)
mkdir -p alpine
scp alexis-bouchez@192.168.1.24:/home/alexis-bouchez/linux.wasm/alpine/alpine_rootfs.json alpine/ 2>/dev/null || echo "Alpine rootfs not found, skipping"
```

Then serve locally:
```bash
cd ~/linux.wasm
python3 -m http.server 8000
```

Access at: http://localhost:8000/test.html
