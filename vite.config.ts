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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - order matters!
          if (id.includes('node_modules')) {
            // Core React must be separate and loaded first
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Radix UI (React components)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Framer Motion (React animation)
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // Charts (depends on React)
            if (id.includes('recharts')) {
              return 'charts';
            }
            // Utility libraries (no React dependency)
            if (id.includes('lucide-react') || id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            // Everything else
            return 'vendor';
          }
          
          // Split pages into separate chunks
          if (id.includes('/client/pages/')) {
            const pageName = id.split('/client/pages/')[1].split('.')[0];
            return `page-${pageName.toLowerCase()}`;
          }
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
