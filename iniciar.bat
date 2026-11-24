@echo off
chcp 65001 >nul
title Sistema Postulantes v2

cd /d "%~dp0"
node dev-runner.cjs
