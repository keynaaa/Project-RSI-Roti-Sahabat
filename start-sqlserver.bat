@echo off
echo ========================================================
echo Menyalakan Layanan SQL Server (MSSQLSERVER25)
echo ========================================================
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Status Service:
    net start MSSQL$MSSQLSERVER25
    echo.
    echo SQL Server berhasil dinyalakan!
    pause
) else (
    echo Meminta hak Administrator untuk menyalakan service...
    powershell -Command "Start-Process cmd -ArgumentList '/c echo Menyalakan MSSQL$MSSQLSERVER25... && net start MSSQL$MSSQLSERVER25 && echo. && echo SELESAI! SQL Server sudah aktif. && pause' -Verb RunAs"
)
