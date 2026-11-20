@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo Setup Database RotiSahabat pada SQL Server
echo ========================================================
echo.
echo Pastikan Service SQL Server MSSQLSERVER25 sudah AKTIF.
echo.

set "SQL_SERVER="
set /p SQL_SERVER="Masukkan Nama Server / Instance (tekan Enter untuk default .\MSSQLSERVER25): "

if "!SQL_SERVER!"=="" set "SQL_SERVER=.\MSSQLSERVER25"

:: Hilangkan spasi di akhir jika ada
for /f "tokens=*" %%a in ("!SQL_SERVER!") do set "SQL_SERVER=%%a"

echo.
echo Menghubungkan ke: !SQL_SERVER! ...
echo Menguji koneksi awal...

sqlcmd -S !SQL_SERVER! -E -C -t 5 -Q "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ========================================================
    echo [PERINGATAN] Tidak dapat terhubung ke SQL Server: !SQL_SERVER!
    echo.
    echo Kemungkinan penyebab:
    echo 1. Layanan SQL Server belum dinyalakan.
    echo 2. Format server/instance belum sesuai.
    echo ========================================================
    echo.
    echo Mencoba menyalakan service MSSQLSERVER25...
    powershell -Command "Start-Process cmd -ArgumentList '/c net start MSSQL$MSSQLSERVER25' -Verb RunAs -Wait"
    timeout /t 3 >nul
    
    echo.
    echo Menguji ulang koneksi ke !SQL_SERVER! ...
    sqlcmd -S !SQL_SERVER! -E -C -t 5 -Q "SELECT 1" >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Masih tidak dapat terhubung.
        echo Silakan buka services.msc dan pastikan SQL Server [MSSQLSERVER25] Running.
        pause
        exit /b 1
    )
)

echo [OK] Koneksi berhasil!
echo.
echo 1. Menjalankan 00-Setup-SQL-Server.sql...
sqlcmd -S !SQL_SERVER! -E -C -i "00-Setup-SQL-Server.sql"
if errorlevel 1 (
    echo [ERROR] Gagal menjalankan 00-Setup-SQL-Server.sql!
    pause
    exit /b 1
)

echo.
echo 2. Menjalankan 01-Create-Database-Tables.sql...
sqlcmd -S !SQL_SERVER! -E -C -i "01-Create-Database-Tables.sql"
if errorlevel 1 (
    echo [ERROR] Gagal menjalankan 01-Create-Database-Tables.sql!
    pause
    exit /b 1
)

echo.
echo 3. Menjalankan 03-PRD-Updates.sql...
sqlcmd -S !SQL_SERVER! -E -C -i "03-PRD-Updates.sql"
if errorlevel 1 (
    echo [ERROR] Gagal menjalankan 03-PRD-Updates.sql!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo BERHASIL! Database RotiSahabat sudah siap digunakan.
echo.
echo Akun login aplikasi:
echo   Owner : username = owner     / password = Owner123!
echo   Staff : username = adminops  / password = Staff123!
echo ========================================================
pause
