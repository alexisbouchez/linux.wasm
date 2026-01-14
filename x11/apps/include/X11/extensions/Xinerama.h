#ifndef _XINERAMA_H
#define _XINERAMA_H

typedef struct { int x, y, width, height; } XineramaScreenInfo;

int XineramaQueryExtension(Display *dpy, int *event_base, int *error_base);
int XineramaIsActive(Display *dpy);
XineramaScreenInfo *XineramaQueryScreens(Display *dpy, int *number);

#endif
