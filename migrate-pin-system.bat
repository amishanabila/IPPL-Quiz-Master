@echo off
REM ============================================================================
REM MIGRATION SCRIPT - PIN System Update
REM ============================================================================
REM Script untuk migrate database dari sistem lama ke sistem PIN baru
REM ============================================================================

echo.
echo ========================================
echo   IPPL Quiz Master - PIN Migration
echo ========================================
echo.

REM Check if migration.sql exists
if not exist "backend\database\migration.sql" (
    echo [ERROR] File migration.sql tidak ditemukan!
    echo Pastikan Anda berada di root folder project.
    pause
    exit /b 1
)

echo [INFO] File migration.sql ditemukan
echo.

REM Prompt for MySQL credentials
set /p MYSQL_USER="Masukkan MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

echo.
echo [INFO] Akan melakukan migration dengan user: %MYSQL_USER%
echo [WARN] Pastikan database 'quiz_master' sudah ada!
echo.

REM Ask for confirmation
set /p CONFIRM="Lanjutkan migration? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [INFO] Migration dibatalkan
    pause
    exit /b 0
)

echo.
echo ========================================
echo   Step 1: Backup Database
echo ========================================
echo.

REM Create backup folder if not exists
if not exist "backend\database\backups" mkdir "backend\database\backups"

REM Generate backup filename with timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BACKUP_FILE=backend\database\backups\backup_%datetime:~0,8%_%datetime:~8,6%.sql

echo [INFO] Membuat backup database...
echo [INFO] File: %BACKUP_FILE%
echo.

mysqldump -u %MYSQL_USER% -p quiz_master > "%BACKUP_FILE%"

if errorlevel 1 (
    echo [ERROR] Backup gagal!
    echo [INFO] Pastikan MySQL berjalan dan password benar
    pause
    exit /b 1
)

echo [OK] Backup berhasil dibuat!
echo.

echo ========================================
echo   Step 2: Run Migration
echo ========================================
echo.

echo [INFO] Menjalankan migration script...
echo [INFO] File: backend\database\migration.sql
echo.

mysql -u %MYSQL_USER% -p quiz_master < backend\database\migration.sql

if errorlevel 1 (
    echo [ERROR] Migration gagal!
    echo [INFO] Database di-restore dari backup...
    mysql -u %MYSQL_USER% -p quiz_master < "%BACKUP_FILE%"
    echo [OK] Database berhasil di-restore
    pause
    exit /b 1
)

echo [OK] Migration berhasil!
echo.

echo ========================================
echo   Step 3: Verification
echo ========================================
echo.

echo [INFO] Memverifikasi migration...
echo.

REM Verify pin_code column
echo [CHECK] Column pin_code di kumpulan_soal...
mysql -u %MYSQL_USER% -p -e "USE quiz_master; DESCRIBE kumpulan_soal;" | findstr "pin_code"
if errorlevel 1 (
    echo [ERROR] Column pin_code tidak ditemukan!
    goto :migration_failed
) else (
    echo [OK] Column pin_code ditemukan
)

echo.

REM Verify function
echo [CHECK] Function generate_unique_pin()...
mysql -u %MYSQL_USER% -p -e "USE quiz_master; SELECT generate_unique_pin() as test_pin;" > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Function generate_unique_pin() tidak ditemukan!
    goto :migration_failed
) else (
    echo [OK] Function generate_unique_pin() ditemukan
)

echo.

REM Verify trigger
echo [CHECK] Trigger before_insert_kumpulan_soal...
mysql -u %MYSQL_USER% -p -e "USE quiz_master; SHOW TRIGGERS LIKE 'kumpulan_soal';" | findstr "before_insert_kumpulan_soal"
if errorlevel 1 (
    echo [ERROR] Trigger before_insert_kumpulan_soal tidak ditemukan!
    goto :migration_failed
) else (
    echo [OK] Trigger before_insert_kumpulan_soal ditemukan
)

echo.

REM Check if all kumpulan_soal have PIN
echo [CHECK] Semua kumpulan_soal punya PIN...
for /f %%i in ('mysql -u %MYSQL_USER% -p -s -N -e "USE quiz_master; SELECT COUNT(*) FROM kumpulan_soal WHERE pin_code IS NULL;"') do set COUNT_NO_PIN=%%i

if %COUNT_NO_PIN% GTR 0 (
    echo [WARN] Ada %COUNT_NO_PIN% kumpulan_soal tanpa PIN!
    echo [INFO] Running auto-fix...
    mysql -u %MYSQL_USER% -p -e "USE quiz_master; UPDATE kumpulan_soal SET pin_code = NULL WHERE pin_code IS NULL;"
    echo [OK] Auto-fix complete
) else (
    echo [OK] Semua kumpulan_soal punya PIN
)

echo.
echo ========================================
echo   MIGRATION COMPLETE!
echo ========================================
echo.
echo [OK] Database berhasil di-migrate ke PIN system baru
echo [OK] Backup tersimpan di: %BACKUP_FILE%
echo.
echo Next Steps:
echo 1. Test PIN validation dari frontend
echo 2. Coba buat kumpulan_soal baru (PIN auto-generate)
echo 3. Verifikasi backend logs
echo.
echo File dokumentasi:
echo - backend\database\DOKUMENTASI_SPLIT_SCHEMA.md
echo - backend\database\README.md
echo - backend\database\SETUP_GUIDE.sql
echo.

pause
exit /b 0

:migration_failed
echo.
echo ========================================
echo   MIGRATION FAILED!
echo ========================================
echo.
echo [ERROR] Migration gagal atau tidak lengkap!
echo [INFO] Database di-restore dari backup...
echo.
mysql -u %MYSQL_USER% -p quiz_master < "%BACKUP_FILE%"
if errorlevel 1 (
    echo [ERROR] Restore gagal!
    echo [WARN] Silakan restore manual dari: %BACKUP_FILE%
) else (
    echo [OK] Database berhasil di-restore
)
echo.
pause
exit /b 1
