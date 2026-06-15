# kintone-dev skill install script
# Usage: powershell -ExecutionPolicy Bypass -File skill\install-skill.ps1

$ErrorActionPreference = "Stop"

$pluginRoot = "$env:APPDATA\Claude\local-agent-mode-sessions\skills-plugin"

if (-not (Test-Path $pluginRoot)) {
    Write-Error "Claude skills-plugin not found: $pluginRoot"
    exit 1
}

$skillsDir = Get-ChildItem $pluginRoot -Recurse -Directory -Filter "skills" |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $skillsDir) {
    Write-Error "skills directory not found. Please open Claude Desktop first."
    exit 1
}

$dst = Join-Path $skillsDir "kintone-dev"
$src = Join-Path $PSScriptRoot "kintone-dev"

if (-not (Test-Path $src)) {
    Write-Error "Source not found: $src. Run from the skill/ directory of kintone-dev-guide repo."
    exit 1
}

New-Item -ItemType Directory -Force "$dst\references" | Out-Null

$files = @(
    @{ src = "$src\SKILL.md";                          dst = "$dst\SKILL.md" }
    @{ src = "$src\references\api-cheatsheet.md";      dst = "$dst\references\api-cheatsheet.md" }
    @{ src = "$src\references\patterns-full.md";       dst = "$dst\references\patterns-full.md" }
    @{ src = "$src\references\performance-guide.md";   dst = "$dst\references\performance-guide.md" }
    @{ src = "$src\references\security-guide.md";      dst = "$dst\references\security-guide.md" }
    @{ src = "$src\references\tools-and-resources.md"; dst = "$dst\references\tools-and-resources.md" }
)

foreach ($f in $files) {
    Copy-Item $f.src $f.dst -Force
    Write-Host "OK: $(Split-Path $f.dst -Leaf)"
}

Write-Host ""
Write-Host "Done. Installed to: $dst"
Write-Host "Please restart Claude Desktop."