'use client'

import { useEffect, useRef, useState } from 'react'
import { X11Server } from './x11_server'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState('initializing')
  const serverRef = useRef<X11Server | null>(null)
  const dmenuModuleRef = useRef<any>(null)

  useEffect(() => {
    async function init() {
      try {
        setStatus('loading x11 server...')
        
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Initialize X11 server
        const server = new X11Server(canvas, ctx)
        await server.init()
        serverRef.current = server
        
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
        
        // Load dmenu
        try {
          const dmenuResponse = await fetch('/dmenu.wasm')
          if (dmenuResponse.ok) {
            const dmenuBuffer = await dmenuResponse.arrayBuffer()
            const dmenuModule = await WebAssembly.instantiate(dmenuBuffer, {
              env: server.getWasmImports()
            })
            dmenuModuleRef.current = dmenuModule
            setStatus('ready (Option+P for dmenu)')
          } else {
            setStatus('ready (dmenu not found)')
          }
        } catch (e) {
          setStatus('ready (dmenu not available)')
        }
      } catch (error) {
        console.error('Init error:', error)
        setStatus('error: ' + (error instanceof Error ? error.message : String(error)))
      }
    }
    
    init()
  }, [])

  // Keyboard shortcut for dmenu (Alt/Option+P)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Alt on Windows/Linux, Option on macOS
      if ((e.altKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        if (dmenuModuleRef.current && serverRef.current) {
          console.log('Opening dmenu...')
          // Run dmenu
          if (dmenuModuleRef.current.instance.exports.main) {
            dmenuModuleRef.current.instance.exports.main(0, 0)
          }
        } else {
          alert('dmenu not loaded. Make sure dmenu.wasm exists in public/')
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Linux WASM - X11 Desktop</h1>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        Press <kbd>Option+P</kbd> (macOS) or <kbd>Alt+P</kbd> (Windows/Linux) to open dmenu
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
