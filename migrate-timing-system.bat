@echo off
echo ========================================
echo  IPPL Quiz Master - Database Migration
echo  Timing System with Session Tracking
echo ========================================
echo.

REM Set MySQL credentials
set MYSQL_USER=root
set MYSQL_DB=quiz_master
set MIGRATION_FILE=backend\database\migrate-add-timing-system.sql

echo [1/4] Checking migration file...
if not exist "%MIGRATION_FILE%" (
    echo ERROR: Migration file not found!
    echo Path: %MIGRATION_FILE%
    pause
    exit /b 1
)
echo ✓ Migration file found

echo.
echo [2/4] Creating backup...
set BACKUP_FILE=backup_before_timing_system_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
echo Backup file: %BACKUP_FILE%

mysql -u %MYSQL_USER% -p --execute="SELECT 'Creating backup...'" %MYSQL_DB%
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL. Please check credentials.
    pause
    exit /b 1
)

mysqldump -u %MYSQL_USER% -p %MYSQL_DB% > %BACKUP_FILE%
if errorlevel 1 (
    echo ERROR: Backup failed!
    pause
    exit /b 1
)
echo ✓ Backup created: %BACKUP_FILE%

echo.
echo [3/4] Running migration...
echo This will:
echo  - Add waktu_keseluruhan column to kumpulan_soal
echo  - Add tipe_waktu column to kumpulan_soal
echo  - Create quiz_session table
echo  - Add session_id to hasil_quiz
echo  - Create new indexes
echo  - Update stored procedures
echo.
set /p CONFIRM="Continue with migration? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Migration cancelled.
    pause
    exit /b 0
)

mysql -u %MYSQL_USER% -p %MYSQL_DB% < %MIGRATION_FILE%
if errorlevel 1 (
    echo ERROR: Migration failed!
    echo You can restore from backup: %BACKUP_FILE%
    pause
    exit /b 1
)
echo ✓ Migration completed successfully

echo.
echo [4/4] Verifying migration...
mysql -u %MYSQL_USER% -p --execute="DESCRIBE kumpulan_soal; SHOW TABLES LIKE 'quiz_session'; DESCRIBE quiz_session; DESCRIBE hasil_quiz;" %MYSQL_DB%
if errorlevel 1 (
    echo WARNING: Verification queries failed
) else (
    echo ✓ Verification completed
)

echo.
echo ========================================
echo  Migration Summary
echo ========================================
echo ✓ Backup created: %BACKUP_FILE%
echo ✓ Migration applied successfully
echo ✓ Database structure updated
echo.
echo New features available:
echo  - Waktu per soal mode
echo  - Waktu keseluruhan quiz mode
echo  - Session-based timing (anti-cheat)
echo  - Progress tracking
echo  - Timer sync with server
echo.
echo Next steps:
echo 1. Restart backend server
echo 2. Test quiz creation
echo 3. Test quiz flow with refresh
echo 4. Verify time tracking
echo.
echo Documentation: DOKUMENTASI_TIMING_SYSTEM.md
echo ========================================
pause
