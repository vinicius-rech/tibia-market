import type { PGlite } from '@electric-sql/pglite'

declare module '#app' {
  interface NuxtApp {
    $pglite: PGlite
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $pglite: PGlite
  }
}

export {}
