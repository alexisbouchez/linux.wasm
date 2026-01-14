export const metadata = {
  title: 'Linux WASM - X11 Desktop',
  description: 'Linux kernel and X11 desktop in the browser',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
