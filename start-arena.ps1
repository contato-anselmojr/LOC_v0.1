Write-Host "🚀 Iniciando Arena Multiverso MVP..." -ForegroundColor Cyan

# --- Caminhos base ---
$root = "C:\Users\Administrador\LOC_v0.1"
$server = "$root\apps\server"
$web = "$root\apps\web"
$engine = "$root\packages\engine"

# --- Passo 1: Prisma Client ---
Write-Host "`n🧩 Gerando cliente Prisma..." -ForegroundColor Yellow
Set-Location $server
try {
  npx prisma generate --schema "$server\prisma\schema.prisma"
} catch {
  Write-Host "⚠️ Prisma já estava gerado, continuando..." -ForegroundColor DarkYellow
}

# --- Passo 2: Engine Build ---
if (Test-Path $engine) {
  Write-Host "`n🧠 Buildando engine modular..." -ForegroundColor Yellow
  Set-Location $engine
  npm install --legacy-peer-deps | Out-Null
  npm run build | Out-Null
}

# --- Passo 3: Iniciar servidor backend ---
Write-Host "`n🟢 Iniciando backend (porta 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "cd $server; npm run dev" -WindowStyle Normal

# --- Passo 4: Iniciar frontend ---
Write-Host "`n🔵 Iniciando frontend (porta 5173)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "cd $web; npm run dev" -WindowStyle Normal

# --- Passo 5: Final ---
Write-Host "`n✅ Tudo pronto! Acesse:" -ForegroundColor Cyan
Write-Host "🌍 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "🧠 Backend:  http://localhost:3000/api/start" -ForegroundColor White
Write-Host "`nUse CTRL+C nos terminais abertos para encerrar." -ForegroundColor DarkGray
