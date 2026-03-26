@echo off
cd /d %~dp0
set PATH=C:\Program Files\nodejs;%PATH%
set ESBUILD_BINARY_PATH=%CD%\node_modules\@esbuild\win32-x64\esbuild.exe
set ESBUILD_WORKER_THREADS=0
set ESBUILD_FORCE_SYNC=1
if not exist "%CD%\logs" mkdir "%CD%\logs"
"C:\Program Files\nodejs\npm.cmd" run dev -- --config vite.config.js > "%CD%\logs\frontend.out" 2> "%CD%\logs\frontend.err"
