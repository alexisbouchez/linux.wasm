/* X11 stub implementations for WASM */
#define Drawable unsigned long
#include "X11/Xlib.h"
#include <stddef.h>

// Stub implementations
Display *XOpenDisplay(char *display_name) { return (Display*)1; }
int XCloseDisplay(Display *display) { return 0; }
Window XCreateWindow(Display *dpy, Window parent, int x, int y, unsigned int width, unsigned int height, unsigned int border_width, int depth, unsigned int class, Visual *visual, unsigned long valuemask, void *attributes) { return 1; }
Window XCreateSimpleWindow(Display *dpy, Window parent, int x, int y, unsigned int width, unsigned int height, unsigned int border_width, unsigned long border, unsigned long background) { return 1; }
int XMapWindow(Display *dpy, Window w) { return 0; }
int XMapRaised(Display *dpy, Window w) { return 0; }
int XUnmapWindow(Display *dpy, Window w) { return 0; }
int XConfigureWindow(Display *dpy, Window w, unsigned int value_mask, void *values) { return 0; }
int XDestroyWindow(Display *dpy, Window w) { return 0; }
GC XCreateGC(Display *dpy, Drawable d, unsigned long valuemask, void *values) { return 1; }
int XSetForeground(Display *dpy, GC gc, unsigned long foreground) { return 0; }
int XSetBackground(Display *dpy, GC gc, unsigned long background) { return 0; }
int XSetLineAttributes(Display *dpy, GC gc, unsigned int line_width, int line_style, int cap_style, int join_style) { return 0; }
int XFillRectangle(Display *dpy, Drawable d, GC gc, int x, int y, unsigned int width, unsigned int height) { return 0; }
int XDrawRectangle(Display *dpy, Drawable d, GC gc, int x, int y, unsigned int width, unsigned int height) { return 0; }
int XDrawString(Display *dpy, Drawable d, GC gc, int x, int y, const char *string, int length) { return 0; }
int XCopyArea(Display *dpy, Drawable src, Drawable dst, GC gc, int src_x, int src_y, unsigned int width, unsigned int height, int dst_x, int dst_y) { return 0; }
int XFlush(Display *dpy) { return 0; }
int XSync(Display *dpy, int discard) { return 0; }
unsigned long XNextEvent(Display *dpy, void *event_return) { return 0; }
int XSelectInput(Display *dpy, Window w, long event_mask) { return 0; }
int XSetInputFocus(Display *dpy, Window focus, int revert_to, int time) { return 0; }
Window XRootWindow(Display *dpy, int screen) { return 1; }
int XDefaultScreen(Display *dpy) { return 0; }
unsigned long XBlackPixel(Display *dpy, int screen) { return 0; }
unsigned long XWhitePixel(Display *dpy, int screen) { return 0xffffff; }
int XStoreName(Display *dpy, Window w, const char *window_name) { return 0; }
int XSetWMProtocols(Display *dpy, Window w, void *protocols, int count) { return 0; }
void *XSetErrorHandler(void *handler) { return NULL; }
void XSetWMHints(Display *dpy, Window w, void *hints) {}
Pixmap XCreatePixmap(Display *dpy, Drawable d, unsigned int width, unsigned int height, unsigned int depth) { return 1; }
int XFreePixmap(Display *dpy, Pixmap pixmap) { return 0; }
int XFreeGC(Display *dpy, GC gc) { return 0; }
void XFree(void *data) {}
Cursor XCreateFontCursor(Display *dpy, unsigned int shape) { return 1; }
int XFreeCursor(Display *dpy, Cursor cursor) { return 0; }
int XDefineCursor(Display *dpy, Window w, Cursor cursor) { return 0; }
int XSupportsLocale(void) { return 1; }
Visual *DefaultVisual(Display *dpy, int screen) { return (Visual*)1; }
Colormap DefaultColormap(Display *dpy, int screen) { return 0; }
int XChangeProperty(Display *dpy, Window w, unsigned long property, unsigned long type, int format, int mode, const unsigned char *data, int nelements) { return 0; }
int XDeleteProperty(Display *dpy, Window w, unsigned long property) { return 0; }
int XQueryTree(Display *dpy, Window w, Window *root_return, Window *parent_return, Window **children_return, unsigned int *nchildren_return) { return 0; }
int XGetWindowAttributes(Display *dpy, Window w, void *window_attributes_return) { return 0; }
int XGetTransientForHint(Display *dpy, Window w, Window *prop_window_return) { return 0; }
int XUngrabKey(Display *dpy, int keycode, unsigned int modifiers, Window grab_window) { return 0; }
