/// <reference types="vitest/config" />
import { copyFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// maplibre-gl's render worker imports a sibling chunk (maplibre-gl-shared.mjs)
// via a plain relative `import`, which Vite's bundler/asset pipeline has no
// visibility into - so neither file makes it into a normal build. Copy both
// straight from the installed package into the build output, unhashed, so
// the worker's relative import keeps resolving. See Map.tsx for the matching
// setWorkerUrl() call.
function copyMaplibreWorker(): Plugin {
  const rootDir = dirname(fileURLToPath(import.meta.url))
  const maplibreDist = dirname(fileURLToPath(import.meta.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs")))
  return {
    name: "copy-maplibre-worker",
    apply: "build",
    closeBundle() {
      const outDir = resolve(rootDir, "dist")
      for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
        copyFileSync(resolve(maplibreDist, file), resolve(outDir, file))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/place-explorer/" : "/",
  plugins: [react(), copyMaplibreWorker()],
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  test: {
    environment: "node",
  },
}))
