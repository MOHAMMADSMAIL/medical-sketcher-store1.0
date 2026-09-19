param([string]$OutputDirectory = "./backups")
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is required' }
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$file = Join-Path $OutputDirectory "aurelia-$timestamp.dump"
pg_dump --format=custom --no-owner --file $file $env:DATABASE_URL
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed' }
Write-Output "Backup created: $file"
