param([Parameter(Mandatory=$true)][string]$BackupFile)
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is required' }
if (-not (Test-Path -LiteralPath $BackupFile)) { throw 'Backup file not found' }
Write-Warning 'This replaces database objects at DATABASE_URL. Confirm the target is a non-production restore database.'
$confirm = Read-Host 'Type RESTORE to continue'
if ($confirm -ne 'RESTORE') { throw 'Restore cancelled' }
pg_restore --clean --if-exists --no-owner --dbname $env:DATABASE_URL $BackupFile
if ($LASTEXITCODE -ne 0) { throw 'pg_restore failed' }
Write-Output 'Restore completed. Run application checks before directing traffic to this database.'
