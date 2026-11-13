import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tasksRouter from "./tasks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/tasks", tasksRouter);

// Server frontend'en som statiske filer fra samme origin (ingen CORS nødvendig)
app.use(express.static(path.join(__dirname, "../../frontend")));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Intern serverfejl" });
});

app.listen(PORT, () => {
  console.log(`TaskFlow kører på http://localhost:${PORT}`);
});
