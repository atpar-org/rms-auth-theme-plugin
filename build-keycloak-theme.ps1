# Build script for Keycloak theme with Java 17
# Keycloakify works better with JDK 17 than JDK 21

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Using Java 17: $env:JAVA_HOME" -ForegroundColor Green
& java -version

Write-Host "`nBuilding Keycloak theme..." -ForegroundColor Cyan
npm run build && keycloakify build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Build completed successfully!" -ForegroundColor Green
    Get-ChildItem "dist_keycloak\*.jar" | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length/1MB, 2)}}
} else {
    Write-Host "`n✗ Build failed!" -ForegroundColor Red
    exit 1
}

