const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const ShiftNote = require("../src/models/ShiftNote");

const envPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: envPath });

const loadNotes = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
};

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const run = async () => {
  const dataFile = path.join(__dirname, "..", "data", "shift_notes.json");
  const notes = await loadNotes(dataFile);

  if (notes.length === 0) {
    console.log("No shift_notes.json entries found to migrate.");
    return;
  }

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/shiftlog";
  await mongoose.connect(mongoUri);

  const ops = notes.map((note) => {
    const createdAt = note.createdAt ? new Date(note.createdAt) : new Date();
    const doc = {
      title: note.title || undefined,
      transcript: note.transcript || "",
      summary: note.summary || undefined,
      source: note.source || "recorded",
      fileName: note.fileName || null,
      durationSec: toNumberOrNull(note.durationSec),
      legacyId: note.id || undefined,
      createdAt,
      updatedAt: createdAt
    };

    if (doc.legacyId) {
      return {
        updateOne: {
          filter: { legacyId: doc.legacyId },
          update: { $setOnInsert: doc },
          upsert: true
        }
      };
    }

    return { insertOne: { document: doc } };
  });

  const result = await ShiftNote.collection.bulkWrite(ops, { ordered: false });

  console.log(
    `Migration complete. Inserted: ${result.insertedCount || 0}, Upserted: ${result.upsertedCount || 0}`
  );
};

run()
  .catch((err) => {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => null);
  });
