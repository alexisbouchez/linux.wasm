/* X11 stub headers for WASM compilation */
#ifndef _XLIB_H
#define _XLIB_H

typedef unsigned long Window;
typedef unsigned long Colormap;
typedef unsigned long Cursor;
typedef unsigned long Pixmap;
typedef unsigned long Font;
typedef unsigned long GC;
typedef unsigned long Visual;
typedef unsigned long XID;
typedef struct _XDisplay Display;
#ifndef Drawable
typedef unsigned long Drawable;
#endif
typedef struct { int x, y; } XPoint;
typedef struct { int x, y, width, height; } XRectangle;

#define None 0L
#define CurrentTime 0L
#define NoEventMask 0L
#define KeyPressMask (1L<<0)
#define KeyReleaseMask (1L<<1)
#define ButtonPressMask (1L<<2)
#define ButtonReleaseMask (1L<<3)
#define EnterWindowMask (1L<<4)
#define LeaveWindowMask (1L<<5)
#define PointerMotionMask (1L<<6)
#define ExposureMask (1L<<15)
#define StructureNotifyMask (1L<<17)
#define SubstructureNotifyMask (1L<<18)
#define SubstructureRedirectMask (1L<<19)
#define FocusChangeMask (1L<<21)
#define PropertyChangeMask (1L<<22)
#define ColormapChangeMask (1L<<23)

#define InputOutput 1
#define InputOnly 2
#define CopyFromParent 0
#define CWBackPixel (1L<<1)
#define CWBorderPixel (1L<<3)
#define CWEventMask (1L<<11)
#define CWDontPropagate (1L<<4)
#define CWColormap (1L<<13)
#define CWOverrideRedirect (1L<<9)

#define Mod1Mask (1<<3)
#define Mod4Mask (1<<6)
#define ShiftMask (1<<0)
#define ControlMask (1<<2)
#define Button1Mask (1<<8)
#define Button2Mask (1<<9)
#define Button3Mask (1<<10)

#define XK_Return 0xff0d
#define XK_space 0x0020
#define XK_Tab 0xff09
#define XK_Escape 0xff1b

Display *XOpenDisplay(char *display_name);
int XCloseDisplay(Display *display);
Window XCreateWindow(Display *dpy, Window parent, int x, int y, unsigned int width, unsigned int height, unsigned int border_width, int depth, unsigned int class, Visual *visual, unsigned long valuemask, void *attributes);
int XMapWindow(Display *dpy, Window w);
int XUnmapWindow(Display *dpy, Window w);
int XConfigureWindow(Display *dpy, Window w, unsigned int value_mask, void *values);
GC XCreateGC(Display *dpy, Drawable d, unsigned long valuemask, void *values);
int XSetForeground(Display *dpy, GC gc, unsigned long foreground);
int XSetBackground(Display *dpy, GC gc, unsigned long background);
int XFillRectangle(Display *dpy, Drawable d, GC gc, int x, int y, unsigned int width, unsigned int height);
int XDrawString(Display *dpy, Drawable d, GC gc, int x, int y, const char *string, int length);
int XFlush(Display *dpy);
int XSync(Display *dpy, int discard);
unsigned long XNextEvent(Display *dpy, void *event_return);
int XSelectInput(Display *dpy, Window w, long event_mask);
Window XRootWindow(Display *dpy, int screen);
int XDefaultScreen(Display *dpy);
unsigned long XBlackPixel(Display *dpy, int screen);
unsigned long XWhitePixel(Display *dpy, int screen);
int XStoreName(Display *dpy, Window w, const char *window_name);
int XSetWMProtocols(Display *dpy, Window w, void *protocols, int count);
void XSetErrorHandler(void *handler);
void XSetWMHints(Display *dpy, Window w, void *hints);

typedef int Drawable;
typedef struct { int type; } XEvent;
typedef struct { Window window; } XButtonEvent;
typedef struct { Window window; unsigned int state; } XKeyEvent;
typedef struct { Window window; int x, y; } XMotionEvent;
typedef struct { Window window; int x, y, width, height; } XExposeEvent;
typedef struct { Window window; int x, y, width, height, border_width; } XConfigureEvent;

#endif
