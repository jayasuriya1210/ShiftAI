const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "shift_notes.json");

const ensureStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
};

const readNotes = async () => {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeNotes = async (notes) => {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2), "utf8");
};

const generateTitle = (transcript) => {
  if (!transcript || typeof transcript !== "string") {
    return "New shift note";
  }
  const cleaned = transcript.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New shift note";
  const sentence = cleaned.split(/[.!?]/)[0];
  const words = sentence.split(" ").slice(0, 8).join(" ");
  return words || "New shift note";
};

const addNote = async (note) => {
  const notes = await readNotes();
  const entry = {
    id: crypto.randomUUID(),
    title: note.title || generateTitle(note.transcript),
    transcript: note.transcript || "",
    source: note.source || "recorded",
    fileName: note.fileName || null,
    durationSec: Number.isFinite(note.durationSec) ? note.durationSec : null,
    createdAt: new Date().toISOString()
  };
  notes.unshift(entry);
  const trimmed = notes.slice(0, 100);
  await writeNotes(trimmed);
  return entry;
};

const listNotes = async (limit = 10) => {
  const notes = await readNotes();
  return notes.slice(0, limit);
};

module.exports = {
  addNote,
  listNotes
};
