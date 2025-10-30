import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading ../.env explicitly
const envPath = path.resolve(__dirname, "..", ".env");
const exists = fs.existsSync(envPath);
dotenv.config({ path: envPath });

console.log("env file exists:", exists ? "YES" : "NO");
console.log("env path:", envPath);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "[SET]" : "[UNDEFINED]");
console.log("MONGODB_DB:", process.env.MONGODB_DB || "[UNDEFINED]");
