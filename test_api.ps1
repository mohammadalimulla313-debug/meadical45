# Test MediExtract AI API
Write-Host "=== Testing MediExtract AI API ===" -ForegroundColor Cyan

# Health Check
Write-Host "`n[1] Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing
    $health.Content | ConvertFrom-Json | Format-List
    Write-Host "Health: PASS" -ForegroundColor Green
} catch {
    Write-Host "Health: FAIL - $_" -ForegroundColor Red
}

# Extraction
Write-Host "`n[2] Text Extraction..." -ForegroundColor Yellow
try {
    $body = '{"text": "Patient has fever and cough. Allergic to penicillin. BP 120/80 mmHg."}'
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/extract/text" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $r = $resp.Content | ConvertFrom-Json
    Write-Host "Counts:" -ForegroundColor Green
    $r.counts | Format-List
    Write-Host "Extraction: PASS" -ForegroundColor Green
} catch {
    Write-Host "Extraction: FAIL - $_" -ForegroundColor Red
}
