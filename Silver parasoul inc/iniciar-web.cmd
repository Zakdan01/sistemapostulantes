@echo off
chcp 65001 >nul
title Consultora de Convocatorias - Web corporativa
cd /d "%~dp0"
echo.
echo   Consultora de Convocatorias - Web corporativa
echo   -------------------------------------
echo   Sirviendo en http://localhost:8080
echo   Presiona CTRL+C para detener.
echo.
start "" http://localhost:8080
python -m http.server 8080
pause
