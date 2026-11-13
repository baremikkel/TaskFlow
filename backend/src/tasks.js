import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

const COLUMNS = "id, title, description, is_completed, created_at";

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Ugyldigt id" });
    return null;
  }
  return id;
}

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM tasks ORDER BY is_completed, created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// READ
router.get("/:id", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  try {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM tasks WHERE id = $1`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Opgave ikke fundet" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// CREATE
router.post("/", async (req, res, next) => {
  const { title, description } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Titel er påkrævet" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING ${COLUMNS}`,
      [title.trim(), typeof description === "string" ? description.trim() || null : null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.patch("/:id", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;

  const body = req.body ?? {};
  const sets = [];
  const values = [];

  if ("title" in body) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return res.status(400).json({ error: "Titel må ikke være tom" });
    }
    values.push(body.title.trim());
    sets.push(`title = $${values.length}`);
  }
  if ("description" in body) {
    values.push(typeof body.description === "string" ? body.description.trim() || null : null);
    sets.push(`description = $${values.length}`);
  }
  if ("is_completed" in body) {
    if (typeof body.is_completed !== "boolean") {
      return res.status(400).json({ error: "is_completed skal være true/false" });
    }
    values.push(body.is_completed);
    sets.push(`is_completed = $${values.length}`);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: "Ingen felter at opdatere" });
  }

  try {
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${COLUMNS}`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: "Opgave ikke fundet" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  try {
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Opgave ikke fundet" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
