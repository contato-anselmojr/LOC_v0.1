param([string]$Root = (Get-Location).Path)

# ---------- helpers ----------
$script:fails = 0; $script:warnings = 0
function Ok($m){ Write-Host "✔ $m" -ForegroundColor Green }
function Warn($m){ $script:warnings++; Write-Host "⚠ $m" -ForegroundColor Yellow }
function Err($m){ $script:fails++; Write-Host "✖ $m" -ForegroundColor Red }

function Assert-Path($path, $label){
  if (Test-Path $path) { Ok "$label ($path)" } else { Err "Faltando: $label ($path)" }
}
function Try-ReadJson($path){
  if (!(Test-Path $path)){ Err "Faltando JSON: $path"; return $null }
  try { return Get-Content -Raw $path | ConvertFrom-Json }
  catch { Err "JSON inválido: $path"; return $null }
}

Write-Host "=== AUDITORIA LOC (Web + Server) ===" -ForegroundColor Cyan
if (!(Test-Path "$Root\.git")) { Warn "Não achei .git em: $Root" } else { Ok ".git encontrado" }

# ---------- paths ----------
$web    = Join-Path $Root "apps\web"
$server = Join-Path $Root "apps\server"

Write-Host "`n--- ESTRUTURA ---" -ForegroundColor Cyan
Assert-Path $web    "apps/web"
Assert-Path $server "apps/server"

# ---------- WEB (Vite) ----------
Write-Host "`n--- WEB (Vite/React) ---" -ForegroundColor Cyan

$webPkgPath = Join-Path $web "package.json"
$webPkg = Try-ReadJson $webPkgPath
Assert-Path (Join-Path $web "vite.config.ts") "vite.config.ts (ou .js)"
if (!(Test-Path (Join-Path $web "vite.config.ts")) -and !(Test-Path (Join-Path $web "vite.config.js"))) {
  Warn "Não encontrei vite.config.ts/js; Vite pode não estar configurado"
}
Assert-Path (Join-Path $web "tsconfig.json") "tsconfig.json"
Assert-Path (Join-Path $web "index.html") "index.html"
# src básicos
$webSrc = Join-Path $web "src"
Assert-Path $webSrc "src/"
# main/app
if (Test-Path (Join-Path $webSrc "main.tsx") -or Test-Path (Join-Path $webSrc "main.jsx")) { Ok "main.[t]sx encontrado" } else { Err "Faltando src/main.tsx ou src/main.jsx" }
if (Test-Path (Join-Path $webSrc "App.tsx") -or Test-Path (Join-Path $webSrc "App.jsx")) { Ok "App.[t]sx encontrado" } else { Err "Faltando src/App.tsx ou src/App.jsx" }

# páginas comuns do projeto
$pages = Join-Path $webSrc "pages"
if (Test-Path $pages) {
  Ok "src/pages/ encontrado"
  if (Get-ChildItem $pages -Recurse -Include *battle* -ErrorAction SilentlyContinue) { Ok "Página de batalha (src/pages/*battle*) presente" } else { Warn "Não achei página de batalha em src/pages/*battle*" }
  if (Get-ChildItem $pages -Recurse -Include *select* -ErrorAction SilentlyContinue) { Ok "Página de seleção (src/pages/*select*) presente" } else { Warn "Não achei página de seleção em src/pages/*select*" }
} else { Warn "Sem diretório src/pages/ (pode ser outra estrutura)" }

# deps/scripts Vite/React
if ($webPkg) {
  $hasVite = ($webPkg.devDependencies.vite -or $webPkg.dependencies.vite)
  if ($hasVite) { Ok "Vite presente em package.json" } else { Err "Vite NÃO encontrado em package.json" }

  $hasReact = ($webPkg.dependencies.react -and $webPkg.dependencies."react-dom")
  if ($hasReact) { Ok "React + ReactDOM presentes" } else { Err "React/ReactDOM ausentes em dependencies" }

  if ($webPkg.scripts.dev -match "vite") { Ok "script npm 'dev' chama Vite" } else { Warn "script 'dev' não referencia Vite" }
  if ($webPkg.scripts.build) { Ok "script npm 'build' encontrado" } else { Warn "script 'build' ausente" }
}

# procura API endpoints no código do web
$apiHits = Select-String -Path (Join-Path $webSrc "*") -Recurse -Pattern "127\.0\.0\.1:3001|/api/start|/api/login|/api/register" -ErrorAction SilentlyContinue
if ($apiHits) {
  Ok "Referências à API encontradas no WEB:"
  $apiHits | Select-Object -First 8 | ForEach-Object { "  - $($_.Path):$($_.LineNumber)  $($_.Line.Trim())" } | Write-Host
} else {
  Warn "WEB não referencia endpoints conhecidos (/api/start, login, etc)."
}

# node_modules (opcional)
if (Test-Path (Join-Path $web "node_modules")) { Ok "node_modules (web) existe" } else { Warn "Sem node_modules na web (precisa de npm i)" }

# ---------- SERVER (Node/TS + Prisma) ----------
Write-Host "`n--- SERVER (Node/TypeScript + Prisma) ---" -ForegroundColor Cyan

$serverPkgPath = Join-Path $server "package.json"
$serverPkg = Try-ReadJson $serverPkgPath

Assert-Path (Join-Path $server "tsconfig.json") "tsconfig.json (server)"
# src básicos
$serverSrc = Join-Path $server "src"
Assert-Path $serverSrc "src/ (server)"
# entry
$entryCandidates = @("index.ts","server.ts","app.ts") | ForEach-Object { Join-Path $serverSrc $_ }
if ($entryCandidates | Where-Object { Test-Path $_ }) {
  Ok "Arquivo de entrada encontrado: $((($entryCandidates | Where-Object { Test-Path $_ }) -join ', '))"
} else { Err "Faltando arquivo de entrada (src/index.ts | server.ts | app.ts)" }

# rotas comuns do projeto
$routesDir = Join-Path $serverSrc "routes"
if (Test-Path $routesDir) {
  Ok "src/routes/ encontrado"
  if (Test-Path (Join-Path $routesDir "battle.ts")) { Ok "routes/battle.ts encontrado" } else { Warn "routes/battle.ts não encontrado" }
} else { Warn "Sem diretório src/routes/" }

# procura endpoints e engine no server
$patterns = "/api/start","/api/login","/api/register","initBattle","declareAction","passTurn","grantTurnEnergy"
$hits = @()
foreach($p in $patterns){
  $hits += Select-String -Path (Join-Path $serverSrc "*") -Recurse -Pattern $p -ErrorAction SilentlyContinue
}
if ($hits){
  Ok "Referências no SERVER:"
  $hits | Select-Object -First 12 | ForEach-Object { "  - $($_.Path):$($_.LineNumber)  $($_.Line.Trim())" } | Write-Host
} else {
  Warn "Não encontrei referências a endpoints/engine padrões (confira se foram movidos)."
}

# Prisma
$prismaDir = Join-Path $server "prisma"
$schema = Join-Path $prismaDir "schema.prisma"
Assert-Path $prismaDir "prisma/"
Assert-Path $schema "prisma/schema.prisma"

if (Test-Path $schema) {
  $schemaText = Get-Content -Raw $schema
  if ($schemaText -match "datasource\s+\w+\s+\{") { Ok "schema: datasource OK" } else { Err "schema: datasource ausente" }
  if ($schemaText -match "generator\s+client\s+\{") { Ok "schema: generator client OK" } else { Err "schema: generator client ausente" }
}

# .env e DATABASE_URL
$envPath = Join-Path $server ".env"
if (Test-Path $envPath) {
  Ok ".env encontrado"
  $envText = Get-Content -Raw $envPath
  if ($envText -match "DATABASE_URL=") { Ok "DATABASE_URL definido em .env" } else { Err "DATABASE_URL não encontrado em .env" }
  # PORT
  if ($envText -match "PORT=") { Ok "PORT definido em .env" } else { Warn "PORT não definido (server pode usar 3001 por padrão)" }
} else { Warn "Sem .env no server" }

# deps do server
if ($serverPkg) {
  $hasPrismaCli = ($serverPkg.devDependencies.prisma -or $serverPkg.dependencies.prisma)
  $hasPrismaClient = ($serverPkg.dependencies."@prisma/client")
  if ($hasPrismaCli) { Ok "prisma (CLI) presente no package.json" } else { Err "prisma (CLI) ausente no package.json" }
  if ($hasPrismaClient) { Ok "@prisma/client presente" } else { Err "@prisma/client ausente em dependencies" }

  if ($serverPkg.scripts.build) { Ok "script npm 'build' (server) encontrado" } else { Warn "script 'build' ausente (server)" }
  if ($serverPkg.scripts.dev -or $serverPkg.scripts.start) { Ok "script 'dev' ou 'start' encontrado" } else { Warn "sem scripts 'dev'/'start' (server)" }
}

# dist/ (build ts)
$dist = Join-Path $server "dist\index.js"
if (Test-Path $dist) { Ok "Build do server presente (dist/index.js)" } else { Warn "Sem dist/index.js (rode: npx tsc -p tsconfig.json)" }

# node_modules server
if (Test-Path (Join-Path $server "node_modules\@prisma\client")) { Ok "node_modules/@prisma/client instalado" } else { Warn "@prisma/client não instalado (npm i)" }

# porta 3001 (opcional)
try {
  $lis = Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq 3001 }
  if ($lis) { Ok "Porta 3001 em LISTEN (server possivelmente rodando)" } else { Warn "Porta 3001 não está em LISTEN agora" }
} catch { Warn "Não foi possível checar portas (permissões?)" }

# ---------- GIT snapshot ----------
Write-Host "`n--- GIT (snapshot) ---" -ForegroundColor Cyan
try {
  $branch = (git rev-parse --abbrev-ref HEAD) 2>$null
  if ($LASTEXITCODE -eq 0) { Ok "Branch atual: $branch" } else { Warn "Git não disponível neste shell" }
  $st = git status -s 2>$null
  if ($st){ Write-Host "Modificações locais:"; $st | ForEach-Object { "  $_" | Write-Host } } else { Write-Host "Sem modificações locais." }
} catch { Warn "Falha ao consultar Git" }

# ---------- resumo ----------
Write-Host "`n=== RESUMO ===" -ForegroundColor Cyan
Write-Host ("Falhas: {0}  Avisos: {1}" -f $script:fails, $script:warnings)
if ($script:fails -gt 0) { Write-Host "Há itens críticos ausentes. Corrija as falhas antes de iniciar." -ForegroundColor Red }
elseif ($script:warnings -gt 0) { Write-Host "Há avisos que podem afetar a execução." -ForegroundColor Yellow }
else { Write-Host "Tudo certo! Estrutura e arquivos essenciais encontrados." -ForegroundColor Green }
