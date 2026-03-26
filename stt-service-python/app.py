from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile

# Ensure HF cache and temp dirs are in writable locations.
_base_dir = os.path.dirname(__file__)
_cache_dir = os.path.join(_base_dir, ".hf_cache_onnx")
_tmp_dir = os.path.join(_base_dir, ".tmp")
os.makedirs(_cache_dir, exist_ok=True)
os.makedirs(_tmp_dir, exist_ok=True)
os.environ.setdefault("HF_HOME", _cache_dir)
os.environ.setdefault("HUGGINGFACE_HUB_CACHE", os.path.join(_cache_dir, "hub"))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
os.environ.setdefault("TMPDIR", _tmp_dir)
os.environ.setdefault("TEMP", _tmp_dir)
os.environ.setdefault("TMP", _tmp_dir)

from parakeet_model import transcribe_audio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=_tmp_dir) as tmp:
        tmp.write(await file.read())
        audio_path = tmp.name

    try:
        text = transcribe_audio(audio_path)
        return {"transcription": text}
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)}
        )
    finally:
        os.remove(audio_path)
