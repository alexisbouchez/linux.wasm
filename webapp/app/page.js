'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('initializing')

  useEffect(() => {
    async function init() {
      try {
        setStatus('loading x11 server...')
        
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        
        // Load X11 server script
        const script = document.createElement('script')
        script.src = '/server/x11_server.js'
        script.type = 'module'
        document.body.appendChild(script)
        
        script.onload = async () => {
          try {
            // Initialize X11 server
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
            console.error('X11 init error:', error)
            setStatus('error: ' + error.message)
          }
        }
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
