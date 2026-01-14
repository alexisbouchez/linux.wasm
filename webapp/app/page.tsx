'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState('initializing')

  useEffect(() => {
    async function init() {
      try {
        setStatus('loading x11 server...')
        
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Dynamically import X11 server from public directory
        const script = document.createElement('script')
        script.src = '/server/x11_server.js'
        script.type = 'module'
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load x11_server.js'))
          document.head.appendChild(script)
        })
        
        // Use dynamic import after script is loaded
        const module = await import('/server/x11_server.js?t=' + Date.now())
        const { X11Server } = module
        const server = new X11Server(canvas, ctx)
        await server.init()
        
        // Load dwm
        setStatus('loading dwm...')
        const dwmResponse = await fetch('/dwm.wasm')
        if (!dwmResponse.ok) {
          throw new Error('Failed to load dwm.wasm')
        }
        const dwmBuffer = await dwmResponse.arrayBuffer()
        const dwmModule = await WebAssembly.instantiate(dwmBuffer, {
          env: server.getWasmImports()
        })
        
        // Start dwm
        if (dwmModule.instance.exports.main) {
          dwmModule.instance.exports.main(0, 0)
        }
        
        setStatus('ready')
      } catch (error) {
        console.error('Init error:', error)
        setStatus('error: ' + (error instanceof Error ? error.message : String(error)))
      }
    }
    
    init()
  }, [])

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Linux WASM - X11 Desktop</h1>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      <canvas
        ref={canvasRef}
        width={1024}
        height={768}
        style={{ 
          border: '1px solid #000', 
          marginTop: '20px',
          background: '#222',
          display: 'block'
        }}
      />
    </main>
  )
}
