# PowerShell script to truncate all tables in the PostgreSQL database using Docker
# Usage: .\truncate-db.ps1

$container = "se_ii_postgres"
$sqlFile = "truncate_all_tables.sql"

# Copy the SQL file into the container
Write-Host "Copying SQL file into container..."
docker cp "backend/database/$sqlFile" ${container}:"/$sqlFile"

# Execute the SQL file inside the container
Write-Host "Running truncate script in container..."
docker exec -it $container psql -U postgres -d se_ii_db -f "/$sqlFile"

Write-Host "Database tables truncated."
