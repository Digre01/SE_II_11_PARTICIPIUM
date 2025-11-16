-- Truncate all main tables and reset identity (PostgreSQL)
TRUNCATE "UserOffice", "Users", "Roles", "Categories", "Offices", "Photos", "Reports" RESTART IDENTITY CASCADE;
