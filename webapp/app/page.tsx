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
        
        // Load X11 server
        const { X11Server } = await import('/server/x11_server.js')
        const server = new X11Server(canvas, ctx)
        await server.init()
        
        // Load dwm
        setStatus('loading dwm...')
        const dwmResponse = await fetch('/dwm.wasm')
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
