export class X11Server {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  display: { width: number; height: number; root: number } | null
  windows: Map<number, { id: number; x: number; y: number; width: number; height: number; background: string }>

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas
    this.ctx = ctx
    this.display = null
    this.windows = new Map()
  }

  async init() {
    // Initialize display
    this.display = {
      width: this.canvas.width,
      height: this.canvas.height,
      root: 1
    }
    
    // Create root window
    this.windows.set(1, {
      id: 1,
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height,
      background: '#222222'
    })
    
    // Create a test window to show it's working
    this.windows.set(2, {
      id: 2,
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      background: '#444444'
    })
    
    this.draw()
    
    // Redraw periodically
    setInterval(() => this.draw(), 100)
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#222222'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Draw windows (skip root)
    for (const [id, win] of this.windows) {
      if (id === 1) continue
      this.ctx.fillStyle = win.background || '#333333'
      this.ctx.fillRect(win.x, win.y, win.width, win.height)
      
      // Draw window border
      this.ctx.strokeStyle = '#666666'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(win.x, win.y, win.width, win.height)
      
      // Draw window title
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '14px monospace'
      this.ctx.fillText(`Window ${id}`, win.x + 10, win.y + 20)
    }
  }

  getWasmImports() {
    return {
      // X11 stubs
      XOpenDisplay: () => 1,
      XCreateWindow: () => {
        const id = this.windows.size + 1
        this.windows.set(id, {
          id,
          x: Math.random() * (this.canvas.width - 400),
          y: Math.random() * (this.canvas.height - 300),
          width: 400,
          height: 300,
          background: `#${Math.floor(Math.random()*16777215).toString(16)}`
        })
        this.draw()
        return id
      },
      XFillRectangle: (display: number, window: number, gc: number, x: number, y: number, width: number, height: number) => {
        const win = this.windows.get(window)
        if (win) {
          this.ctx.fillStyle = '#555555'
          this.ctx.fillRect(win.x + x, win.y + y, width, height)
        }
      },
      XSync: () => {},
      XSelectInput: () => {},
      XSetErrorHandler: () => {},
    }
  }
}
