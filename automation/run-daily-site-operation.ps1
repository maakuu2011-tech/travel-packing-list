param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectPath = 'C:\Users\maaku\Documents\Codex\travel-packing-list'
$promptPath = Join-Path $projectPath 'automation\daily-site-operation.prompt.md'
$logDirectory = Join-Path $env:USERPROFILE '.codex\site-automation-logs\travel-packing-list'
$lockPath = Join-Path $logDirectory 'running.lock'
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logPath = Join-Path $logDirectory "$timestamp.log"
$reportPath = Join-Path $logDirectory "$timestamp-report.md"

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

if (Test-Path -LiteralPath $lockPath) {
  $lockAge = (Get-Date) - (Get-Item -LiteralPath $lockPath).LastWriteTime
  if ($lockAge.TotalHours -lt 6) {
    "A run is already active. Lock: $lockPath" | Tee-Object -FilePath $logPath
    exit 2
  }

  Remove-Item -LiteralPath $lockPath -Force
}

New-Item -ItemType File -Path $lockPath -Force | Out-Null

try {
  if (-not (Test-Path -LiteralPath $promptPath)) {
    throw "Prompt file was not found: $promptPath"
  }

  $codexRoot = Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin'
  $codexPath = Get-ChildItem -LiteralPath $codexRoot -Recurse -Filter 'codex.exe' -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName

  if (-not $codexPath) {
    throw "Codex CLI was not found under: $codexRoot"
  }

  if ($DryRun) {
    @(
      "Dry run passed."
      "Codex: $codexPath"
      "Project: $projectPath"
      "Prompt: $promptPath"
      "Log directory: $logDirectory"
    ) | Tee-Object -FilePath $logPath
    exit 0
  }

  $prompt = Get-Content -LiteralPath $promptPath -Raw -Encoding UTF8

  & $codexPath `
    -a never `
    exec `
    -C $projectPath `
    -s danger-full-access `
    -o $reportPath `
    $prompt 2>&1 | Tee-Object -FilePath $logPath

  if ($LASTEXITCODE -ne 0) {
    throw "Codex exited with code $LASTEXITCODE. See: $logPath"
  }

  Get-ChildItem -LiteralPath $logDirectory -File |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-45) } |
    Remove-Item -Force
}
finally {
  if (Test-Path -LiteralPath $lockPath) {
    Remove-Item -LiteralPath $lockPath -Force
  }
}
