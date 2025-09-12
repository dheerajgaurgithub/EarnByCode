# Create client directory structure
$clientDir = "$PWD\client"
New-Item -ItemType Directory -Force -Path $clientDir

# Move frontend files and directories
$frontendDirs = @(
    "public",
    "src",
    ".env",
    ".env.production",
    "index.html",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "tailwind.config.js",
    "tailwind.config.cjs",
    "postcss.config.js"
)

foreach ($dir in $frontendDirs) {
    if (Test-Path $dir) {
        Write-Host "Moving $dir to client/"
        Move-Item -Path $dir -Destination $clientDir -Force
    }
}

# Create new root package.json for client
$rootPackageJson = @{
    "name" = "algobucks-client"
    "version" = "1.0.0"
    "private" = $true
    "scripts" = @{
        "dev" = "cd client && npm run dev"
        "build" = "cd client && npm run build"
        "preview" = "cd client && npm run preview"
        "lint" = "cd client && npm run lint"
    }
} | ConvertTo-Json -Depth 10

Set-Content -Path "$PWD\package.json" -Value $rootPackageJson

Write-Host "Frontend files have been moved to the client/ directory."
Write-Host "Please run 'cd client && npm install' to install frontend dependencies."
