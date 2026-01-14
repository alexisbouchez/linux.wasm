'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('initializing')
  const [wasmModule, setWasmModule] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        setStatus('loading wasm...')
        
        // Load X11 server WASM
        const wasm = await import('../public/x11_server.wasm')
        setWasmModule(wasm)
        
        // Load dwm
        const dwm = await fetch('/dwm.wasm').then(r => r.arrayBuffer())
        
        setStatus('ready')
      } catch (error) {
        console.error('Init error:', error)
        setStatus('error: ' + error.message)
      }
    }
    
    init()
  }, [])

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Linux WASM - X11 Desktop</h1>
      <div>Status: {status}</div>
      <canvas
        ref={canvasRef}
        width={1024}
        height={768}
        style={{ border: '1px solid #000', marginTop: '20px' }}
      />
    </main>
  )
}
