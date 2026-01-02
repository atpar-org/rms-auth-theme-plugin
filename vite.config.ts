import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        keycloakify({
            accountThemeImplementation: "Multi-Page",
            keycloakVersionTargets: ["26.2"]
        })
    ],
    resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      }
});
