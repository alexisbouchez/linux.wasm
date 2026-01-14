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
int XSetWMHints(Display *dpy, Window w, void *hints) { return 0; }
Pixmap XCreatePixmap(Display *dpy, Drawable d, unsigned int width, unsigned int height, unsigned int depth) { return 1; }
int XFreePixmap(Display *dpy, Pixmap pixmap) { return 0; }
int XFreeGC(Display *dpy, GC gc) { return 0; }
int XFree(void *data) { return 0; }
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
int XUngrabButton(Display *dpy, unsigned int button, unsigned int modifiers, Window grab_window) { return 0; }
int XSetClassHint(Display *dpy, Window w, void *hints) { return 0; }
int XKeysymToKeycode(Display *dpy, unsigned long keysym) { return 0; }
int XGrabKey(Display *dpy, int keycode, unsigned int modifiers, Window grab_window, int owner_events, int pointer_mode, int keyboard_mode) { return 0; }
int XSetWindowBorder(Display *dpy, Window w, unsigned long border_pixel) { return 0; }
int XGetWindowProperty(Display *dpy, Window w, unsigned long property, long long_offset, long long_length, int delete, unsigned long req_type, unsigned long *actual_type_return, int *actual_format_return, unsigned long *nitems_return, unsigned long *bytes_after_return, unsigned char **prop_return) { return 0; }
int XGetClassHint(Display *dpy, Window w, void *hints_return) { return 0; }
int XRaiseWindow(Display *dpy, Window w) { return 0; }
int XMoveResizeWindow(Display *dpy, Window w, int x, int y, unsigned int width, unsigned int height) { return 0; }
int XGrabServer(Display *dpy) { return 0; }
int XUngrabServer(Display *dpy) { return 0; }
int XQueryPointer(Display *dpy, Window w, Window *root_return, Window *child_return, int *root_x_return, int *root_y_return, int *win_x_return, int *win_y_return, unsigned int *mask_return) { return 0; }
int XGetTextProperty(Display *dpy, Window w, void *text_prop_return, unsigned long property) { return 0; }
int XmbTextPropertyToTextList(Display *dpy, void *text_prop, char ***list_return, int *count_return) { return 0; }
void XFreeStringList(char **list) {}
void *XGetModifierMapping(Display *dpy) { return NULL; }
int XFreeModifierMapping(void *modmap) { return 0; }
int XFreeModifiermap(void *modmap) { return 0; } // Typo in dwm source
int XKeycodeToKeysym(Display *dpy, unsigned int keycode, int index) { return 0; }
int XAllowEvents(Display *dpy, int event_mode, unsigned int time) { return 0; }
int XRefreshKeyboardMapping(void *event_struct) { return 0; }
int XGrabButton(Display *dpy, unsigned int button, unsigned int modifiers, Window grab_window, int owner_events, unsigned int event_mask, int pointer_mode, int keyboard_mode, Window confine_to, Cursor cursor) { return 0; }
int XGetWMHints(Display *dpy, Window w, void *hints_return) { return 0; } // Note: dwm expects 2 params but standard is 3
int XGetWMNormalHints(Display *dpy, Window w, void *hints_return, long *supplied_return) { return 0; }
int XCheckMaskEvent(Display *dpy, long event_mask, void *event_return) { return 0; }
int XSetCloseDownMode(Display *dpy, int close_mode) { return 0; }
int XKillClient(Display *dpy, unsigned long resource) { return 0; }
int XGetWMProtocols(Display *dpy, Window w, void **protocols_return, int *count_return) { return 0; }
int XMoveWindow(Display *dpy, Window w, int x, int y) { return 0; }
int XGrabPointer(Display *dpy, Window grab_window, int owner_events, unsigned int event_mask, int pointer_mode, int keyboard_mode, Window confine_to, Cursor cursor, unsigned int time) { return 0; }
unsigned long XMaskEvent(Display *dpy, long event_mask, void *event_return) { return 0; }
int XUngrabPointer(Display *dpy, unsigned int time) { return 0; }
int XWarpPointer(Display *dpy, Window src_w, Window dest_w, int src_x, int src_y, unsigned int src_width, unsigned int src_height, int dest_x, int dest_y) { return 0; }
