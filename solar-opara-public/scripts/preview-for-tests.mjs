import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// A deliberately fake public key lets isolated browser tests intercept Supabase requests.
// It is never written to .env and never used in the production build.
const child = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)), "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
  stdio: "inherit",
  env: { ...process.env, VITE_SUPABASE_PUBLISHABLE_KEY: "test-only-publishable-key" },
});
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
child.on("exit", (code) => process.exit(code ?? 1));
