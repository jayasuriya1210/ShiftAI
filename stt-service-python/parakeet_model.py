import os
import tempfile
import subprocess
import wave
from typing import List

from onnx_asr import load_model
import imageio_ffmpeg

MODEL_ID = os.environ.get("ASR_MODEL_ID", "nemo-parakeet-tdt-0.6b-v2")
CHUNK_SECONDS = int(os.environ.get("ASR_CHUNK_SECONDS", "30"))
OVERLAP_SECONDS = int(os.environ.get("ASR_CHUNK_OVERLAP_SECONDS", "2"))

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = load_model(MODEL_ID)
    return _model


def _convert_to_wav(path: str) -> str:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    os.environ.setdefault("FFMPEG_BINARY", ffmpeg)
    fd, out_path = tempfile.mkstemp(suffix=".wav", dir=os.environ.get("TMPDIR") or None)
    os.close(fd)

    cmd = [
        ffmpeg,
        "-y",
        "-i",
        path,
        "-ac",
        "1",
        "-ar",
        "16000",
        out_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return out_path


def _chunk_wav(path: str) -> List[str]:
    chunks = []
    with wave.open(path, "rb") as wav:
        framerate = wav.getframerate()
        channels = wav.getnchannels()
        sampwidth = wav.getsampwidth()
        total_frames = wav.getnframes()

        chunk_frames = int(max(CHUNK_SECONDS, 5) * framerate)
        overlap_frames = int(max(min(OVERLAP_SECONDS, CHUNK_SECONDS - 1), 0) * framerate)

        start = 0
        while start < total_frames:
            wav.setpos(start)
            frames_to_read = min(chunk_frames, total_frames - start)
            data = wav.readframes(frames_to_read)

            fd, out_path = tempfile.mkstemp(suffix=".wav", dir=os.environ.get("TMPDIR") or None)
            os.close(fd)
            with wave.open(out_path, "wb") as out_wav:
                out_wav.setnchannels(channels)
                out_wav.setsampwidth(sampwidth)
                out_wav.setframerate(framerate)
                out_wav.writeframes(data)

            chunks.append(out_path)

            if start + frames_to_read >= total_frames:
                break
            start = max(0, start + chunk_frames - overlap_frames)

    return chunks


def _run_model(path: str) -> str:
    model = _get_model()
    result = model.recognize(path)
    if isinstance(result, dict) and "text" in result:
        return result["text"]
    return str(result)


def transcribe_audio(path: str) -> str:
    try:
        wav_path = _convert_to_wav(path)
        chunk_paths = _chunk_wav(wav_path)

        if len(chunk_paths) == 1:
            result = _run_model(chunk_paths[0])
            os.remove(chunk_paths[0])
            os.remove(wav_path)
            return result

        texts = []
        for chunk_path in chunk_paths:
            texts.append(_run_model(chunk_path))
            os.remove(chunk_path)

        os.remove(wav_path)
        return " ".join(t for t in texts if t).strip()
    except Exception as exc:
        raise RuntimeError(f"Transcription failed: {exc}") from exc
