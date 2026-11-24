@echo off
chcp 65001 >nul
title Deteniendo Sistema Postulantes v2

echo ===================================================
echo     Deteniendo Servicios (Puertos 3000 y 5173)
echo ===================================================
echo.

setlocal enabledelayedexpansion

set PUERTOS=3000 5173

for %%P in (%PUERTOS%) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%%P\>.*LISTENING"') do (
        set "PID=%%a"
        if defined PID (
            echo   - Cerrando proceso en puerto %%P ^(PID: !PID!^)...
            taskkill /F /PID !PID! /T >nul 2>&1
        )
    )
)

echo.
echo ===================================================
echo  Puertos 3000 y 5173 liberados.
echo ===================================================
echo.
ping 127.0.0.1 -n 2 >nul
