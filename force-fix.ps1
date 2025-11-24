Write-Host "=== FORCE FIX - Clear Everything ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "1. Killing all Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ All Node processes killed" -ForegroundColor Green
Write-Host ""

# Step 2: Clear npm cache
Write-Host "2. Clearing npm cache..." -ForegroundColor Yellow
Set-Location "d:\IPPL-Quiz-Master\backend"
npm cache clean --force | Out-Null
Set-Location "d:\IPPL-Quiz-Master\frontend"
npm cache clean --force | Out-Null
Write-Host "   ✅ npm cache cleared" -ForegroundColor Green
Write-Host ""

# Step 3: Delete node_modules/.cache if exists (Vite cache)
Write-Host "3. Deleting Vite cache..." -ForegroundColor Yellow
$viteCachePath = "d:\IPPL-Quiz-Master\frontend\node_modules\.vite"
if (Test-Path $viteCachePath) {
    Remove-Item -Path $viteCachePath -Recurse -Force
    Write-Host "   ✅ Vite cache deleted" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No Vite cache found" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Delete dist folder (build artifacts)
Write-Host "4. Deleting build artifacts..." -ForegroundColor Yellow
$distPath = "d:\IPPL-Quiz-Master\frontend\dist"
if (Test-Path $distPath) {
    Remove-Item -Path $distPath -Recurse -Force
    Write-Host "   ✅ Dist folder deleted" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No dist folder found" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Start backend
Write-Host "5. Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host '=== BACKEND SERVER ===' -ForegroundColor Cyan; cd 'd:\IPPL-Quiz-Master\backend' ; npm start"
Start-Sleep -Seconds 3
Write-Host "   ✅ Backend started (check new window)" -ForegroundColor Green
Write-Host ""

# Step 6: Start frontend
Write-Host "6. Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host '=== FRONTEND SERVER ===' -ForegroundColor Magenta; cd 'd:\IPPL-Quiz-Master\frontend' ; npm run dev"
Start-Sleep -Seconds 3
Write-Host "   ✅ Frontend started (check new window)" -ForegroundColor Green
Write-Host ""

# Step 7: Instructions
Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WAJIB: Clear Browser Cache!" -ForegroundColor Red
Write-Host ""
Write-Host "Option 1 - Incognito Mode (RECOMMENDED):" -ForegroundColor Yellow
Write-Host "   1. Press Ctrl+Shift+N (open incognito)" -ForegroundColor White
Write-Host "   2. Go to http://localhost:5173" -ForegroundColor White
Write-Host "   3. Test quiz" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Hard Reload:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:5173" -ForegroundColor White
Write-Host "   2. Press F12 (open DevTools)" -ForegroundColor White
Write-Host "   3. RIGHT-CLICK Refresh button" -ForegroundColor White
Write-Host "   4. Select 'Empty Cache and Hard Reload'" -ForegroundColor White
Write-Host ""
Write-Host "Option 3 - Clear All Data:" -ForegroundColor Yellow
Write-Host "   1. Press Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "   2. Select 'All time'" -ForegroundColor White
Write-Host "   3. Check 'Cached images and files'" -ForegroundColor White
Write-Host "   4. Click 'Clear data'" -ForegroundColor White
Write-Host ""
Write-Host "=== VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "After clearing cache, check Console (F12):" -ForegroundColor Yellow
Write-Host "   ✅ Look for: '📝 Soal types: 1: isian'" -ForegroundColor Green
Write-Host "   ✅ Look for: '📝 First soal jawaban type: object array'" -ForegroundColor Green
Write-Host ""
Write-Host "If you see 'pilihan_ganda' or 'single':" -ForegroundColor Red
Write-Host "   → Browser cache NOT cleared!" -ForegroundColor Red
Write-Host "   → Try Incognito mode (Ctrl+Shift+N)" -ForegroundColor Red
Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
