/*
FILE 00 - SETUP SQL SERVER (SSMS)
*/

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'RotiSahabatOwner')
BEGIN
    CREATE LOGIN RotiSahabatOwner
    WITH PASSWORD = 'GantiPassword_Owner123!',
         CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'RotiSahabatOperasional')
BEGIN
    CREATE LOGIN RotiSahabatOperasional
    WITH PASSWORD = 'GantiPassword_Admin123!',
         CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
END;
GO

SELECT name, type_desc
FROM sys.server_principals
WHERE name IN (N'RotiSahabatOwner', N'RotiSahabatOperasional');
GO
