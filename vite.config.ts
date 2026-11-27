import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  build: {
    rollupOptions: {
      // second page: the isolated Website Builder preview (loaded in an iframe by the Dashboard)
      input: {
        main: path.resolve(__dirname, "index.html"),
        "builder-preview": path.resolve(__dirname, "builder-preview.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
