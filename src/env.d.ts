/// <reference types="astro/client" />

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
