#ifndef _XFT_H
#define _XFT_H

typedef struct _XftFont XftFont;
typedef struct _XftDraw XftDraw;
typedef struct { unsigned long pixel; } XftColor;

XftFont *XftFontOpenName(Display *dpy, int screen, const char *name);
void XftFontClose(Display *dpy, XftFont *font);
XftDraw *XftDrawCreate(Display *dpy, Drawable d, Visual *visual, Colormap colormap);
void XftDrawDestroy(XftDraw *draw);
void XftDrawStringUtf8(XftDraw *draw, const XftColor *color, XftFont *font, int x, int y, const unsigned char *string, int len);
int XftTextExtentsUtf8(Display *dpy, XftFont *font, const unsigned char *string, int len, void *extents);

#endif
