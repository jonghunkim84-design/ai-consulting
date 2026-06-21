import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/claude": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, "/v1/messages"),
        headers: {
          "x-api-key": process.env.VITE_CLAUDE_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
      "/api/transcribe": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
