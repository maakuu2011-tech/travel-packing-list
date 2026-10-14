param(
  [switch]$DryRun,
  [switch]$SmokeTest,
  [ValidateSet('daily', 'weekly')]
  [string]$Operation = 'daily'
)

$ErrorActionPreference = 'Stop'

$projectPath = 'C:\Users\maaku\Documents\Codex\travel-packing-list'
$promptFile = if ($Operation -eq 'weekly') { 'weekly-growth-research.prompt.md' } else { 'daily-site-operation.prompt.md' }
$promptPath = Join-Path $projectPath "automation\$promptFile"
$logDirectory = 'C:\Users\maaku\.codex\site-automation-logs\travel-packing-list'
$lockFile = if ($Operation -eq 'weekly') { 'weekly-running.lock' } else { 'running.lock' }
$lockPath = Join-Path $logDirectory $lockFile
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logName = if ($Operation -eq 'weekly') { "$timestamp-weekly.log" } else { "$timestamp.log" }
$reportName = if ($Operation -eq 'weekly') { "$timestamp-weekly-report.md" } else { "$timestamp-report.md" }
$logPath = Join-Path $logDirectory $logName
$reportPath = Join-Path $logDirectory $reportName
$ownsLock = $false

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

try {
  @(
    "Started: $(Get-Date -Format o)"
    "User: $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)"
    "Project: $projectPath"
    "Operation: $Operation"
  ) | Set-Content -LiteralPath $logPath -Encoding UTF8

  if (Test-Path -LiteralPath $lockPath) {
    $lockAge = (Get-Date) - (Get-Item -LiteralPath $lockPath).LastWriteTime
    if ($lockAge.TotalHours -lt 6) {
      "A run is already active. Lock: $lockPath" | Tee-Object -FilePath $logPath -Append
      exit 2
    }

    Remove-Item -LiteralPath $lockPath -Force
  }

  New-Item -ItemType File -Path $lockPath -Force | Out-Null
  $ownsLock = $true

  if (-not (Test-Path -LiteralPath $promptPath)) {
    throw "Prompt file was not found: $promptPath"
  }

  $codexRoot = 'C:\Users\maaku\AppData\Local\OpenAI\Codex\bin'
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
    ) | Tee-Object -FilePath $logPath -Append
    exit 0
  }

  if ($SmokeTest) {
    $prompt = '[TabijitakuList smoke test] Do not inspect or modify files. Reply with exactly: AUTOMATION_TEST_OK'
  }
  else {
    $prompt = Get-Content -LiteralPath $promptPath -Raw -Encoding UTF8
  }

  # Codex writes startup information to stderr even during successful runs.
  # Windows PowerShell can turn that stream into a terminating error under Stop.
  $ErrorActionPreference = 'Continue'
  & $codexPath `
    -a never `
    exec `
    -C $projectPath `
    -s danger-full-access `
    -o $reportPath `
    $prompt 2>&1 | Tee-Object -FilePath $logPath -Append

  $codexExitCode = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'

  if ($codexExitCode -ne 0) {
    throw "Codex exited with code $codexExitCode. See: $logPath"
  }

  Get-ChildItem -LiteralPath $logDirectory -File |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-45) } |
    Remove-Item -Force
}
catch {
  @(
    "Failed: $(Get-Date -Format o)"
    ($_ | Out-String)
  ) | Add-Content -LiteralPath $logPath -Encoding UTF8
  exit 1
}
finally {
  if ($ownsLock -and (Test-Path -LiteralPath $lockPath)) {
    Remove-Item -LiteralPath $lockPath -Force
  }
}
