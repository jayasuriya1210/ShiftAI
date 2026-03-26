const fs = require("fs/promises");
const path = require("path");
const { Blob } = require("buffer");

async function transcribeAudio(filePath) {
  const sttUrl = process.env.STT_URL || "http://localhost:8000/transcribe";
  const data = await fs.readFile(filePath);
  const form = new FormData();

  form.append("file", new Blob([data]), path.basename(filePath));

  const response = await fetch(sttUrl, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`STT service error: ${response.status} ${text}`);
  }

  const payload = await response.json();
  return payload.transcription;
}

module.exports = { transcribeAudio };
