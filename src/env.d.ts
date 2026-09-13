/// <reference types="astro/client" />

// iframe-resizer v4 ships no bundled types; declare just the parent host we use
// (the default export of its host build). See src/scripts/bokun.ts.
declare module 'iframe-resizer/js/iframeResizer.js' {
  interface IFrameResizeOptions {
    checkOrigin?: boolean | string[];
    heightCalculationMethod?: string;
    log?: boolean;
    [option: string]: unknown;
  }
  const iframeResize: (
    options: IFrameResizeOptions,
    target: string | HTMLIFrameElement | HTMLIFrameElement[],
  ) => HTMLIFrameElement[];
  export default iframeResize;
}

declare namespace App {
  interface Locals {
    /**
     * Set by src/middleware.ts once a request under /admin has a valid session.
     * Absent on public routes and on the login page, so pages must not assume it.
     */
    admin?: {
      email: string;
      name: string;
    };
  }
}
