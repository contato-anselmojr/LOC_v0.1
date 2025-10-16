param([switch]$Clean)

Write-Host "== Arena Multiverso :: START ALL =="

# Limpeza opcional
if ($Clean) {
  Write-Host "🧹 Limpando caches..."
  Remove-Item -Recurse -Force "apps\web\.vite","apps\web\node_modules","apps\server\node_modules" -ErrorAction SilentlyContinue
  npm install
}

# Gera Prisma
Push-Location apps\server
npx prisma generate
Pop-Location

# Abre duas janelas visíveis com logs
Start-Process powershell -ArgumentList '-NoExit','-Command','cd "$pwd\apps\server"; npm run dev'
Start-Process powershell -ArgumentList '-NoExit','-Command','cd "$pwd\apps\web"; npm run dev'

Write-Host "`n✅ Servidores iniciados:"
Write-Host "   ⚙️ Backend:  http://localhost:3000"
Write-Host "   🌐 Frontend: http://localhost:5173"
Write-Host "`nDica: use .\start-all.ps1 -Clean para rebuild completo."
