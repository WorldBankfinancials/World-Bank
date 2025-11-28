# reset-build.ps1
# PowerShell script to fully reset, clean, compile, and run a full-stack Vite + Node + TS project

Write-Host "========== RESETTING PROJECT =========="

# -----------------------
# 1️⃣ Delete node_modules and lock files
# -----------------------
Write-Host "`nCleaning node_modules and lock files..."
$dirsToRemove = @("node_modules", "client\node_modules", "server\node_modules")
foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force
        Write-Host "Deleted $dir"
    }
}

$filesToRemove = @("package-lock.json", "client\package-lock.json", "server\package-lock.json")
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Deleted $file"
    }
}

# -----------------------
# 2️⃣ Delete build outputs
# -----------------------
Write-Host "`nDeleting build directories..."
$buildDirs = @("dist", "client\dist", "server\dist", "shared\dist")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force
        Write-Host "Deleted $dir"
    }
}

# -----------------------
# 3️⃣ Clear npm cache
# -----------------------
Write-Host "`nClearing npm cache..."
npm cache clean --force

# -----------------------
# 4️⃣ Install dependencies
# -----------------------
Write-Host "`nInstalling dependencies..."
npm install

# -----------------------
# 5️⃣ Compile TypeScript
# -----------------------
Write-Host "`nCompiling TypeScript..."
$npxTscExists = Get-Command "npx" -ErrorAction SilentlyContinue
if (-not $npxTscExists) {
    Write-Host "❌ npx not found. Make sure Node.js is installed and in PATH."
    exit
}

# Compile root, client, and server
Write-Host "Compiling root tsconfig..."
npx tsc --build tsconfig.json

Write-Host "Compiling client tsconfig..."
npx tsc --build client/tsconfig.json

Write-Host "Compiling server tsconfig..."
npx tsc --build server/tsconfig.json

Write-Host "✅ TypeScript compilation complete."

# -----------------------
# 6️⃣ Start dev servers
# -----------------------
Write-Host "`nStarting dev servers..."
npm run dev