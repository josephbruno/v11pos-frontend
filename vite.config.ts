import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist/spa",
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Group all React-related libraries together to avoid context issues
          'react-vendor': [
            'react', 
            'react-dom', 
            'react/jsx-runtime',
            'react-router-dom'
          ],
          // UI components
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-slot',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-separator',
            '@radix-ui/react-popover',
          ],
          // State management
          'query-vendor': ['@tanstack/react-query'],
          // Animation
          'animation-vendor': ['framer-motion'],
          // Charts
          'charts': ['recharts'],
        },
      },
    },
    sourcemap: false, // Disable sourcemaps for production to reduce build size
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
