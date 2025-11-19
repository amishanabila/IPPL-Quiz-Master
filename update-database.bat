@echo off
echo ========================================
echo Update Database quiz_master
echo ========================================
echo.

REM Set MySQL path (sesuaikan dengan instalasi XAMPP Anda)
set MYSQL_PATH=C:\xampp\mysql\bin
set MYSQL_USER=root
set MYSQL_PASS=

REM Jalankan schema SQL
echo Menjalankan schema.sql...
"%MYSQL_PATH%\mysql.exe" -u %MYSQL_USER% --password=%MYSQL_PASS% < backend\database\schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database berhasil diupdate!
    echo ========================================
    echo.
    echo Silakan restart backend server:
    echo   cd backend
    echo   npm start
    echo.
) else (
    echo.
    echo ========================================
    echo Error! Database gagal diupdate.
    echo ========================================
    echo.
    echo Pastikan:
    echo 1. MySQL sudah running
    echo 2. Path MySQL sudah benar
    echo 3. Username dan password benar
    echo.
)

pause
