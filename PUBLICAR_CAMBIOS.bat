@echo off
echo ========================================================
echo   UA EVENTOS 2026 — PUBLICAR CAMBIOS EN VIVO
echo ========================================================
echo.

echo [1/2] Publicando Backend y Panel Admin en Google Apps Script...
cd /d "%~dp0apps-script"
call clasp push --force
call clasp deploy -i "AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba" --description "Publicacion automatica desde script BAT"

echo.
echo [2/2] Publicando Landing Page, Check-in y Portal Admin en Firebase Hosting...
cd /d "%~dp0firebase"
call firebase deploy --only hosting --project ua-eventos-uy

echo.
echo ========================================================
echo   ✅ ¡PUBLICACIÓN COMPLETADA EXITOSAMENTE!
echo ========================================================
echo.
pause
