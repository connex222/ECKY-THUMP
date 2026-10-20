# ECKEY THUMP v1.2 - copy safely to an existing repository (no force push).
# This runs on the user's Windows machine using their Git credentials.
$ErrorActionPreference='Stop'
$repo='https://github.com/connex222/ECKY-THUMP.git'
$repoLink='https://github.com/connex222/ECKY-THUMP'
$project=$PSScriptRoot
$work=Join-Path $env:TEMP ('eckey-thump-github-upload-'+[guid]::NewGuid().ToString('N'))
$repoDir=Join-Path $work 'repo'
try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {throw 'Git for Windows not installed. Download from https://git-scm.com/download/win'}
    if (-not (Test-Path (Join-Path $project 'server/index.js'))) {throw 'The uploader must be in the extracted ECKEY THUMP project folder.'}
    New-Item -ItemType Directory -Path $work -Force | Out-Null
    Write-Host 'Cloning the existing GitHub repository...' -ForegroundColor Cyan
    & git clone --single-branch --branch main $repo $repoDir
    if ($LASTEXITCODE -ne 0) {throw 'Could not clone the repository. Check the network connection.'}

    Write-Host 'Copying v1.2 game files without deleting existing repository files...' -ForegroundColor Cyan
    # Do not delete remote files or copy Git internals; file sync is additive/overwrite only.
    & robocopy $project $repoDir /E /R:2 /W:1 /NP /NFL /NDL /NJH /NJS /XD .git node_modules
    if ($LASTEXITCODE -ge 8) {throw 'Copy failed. Robocopy error code '+$LASTEXITCODE}
    & git -C $repoDir add -A
    if ($LASTEXITCODE -ne 0) {throw 'Git could not stage the files.'}
    & git -C $repoDir diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'The repository already contains these files. No update needed.' -ForegroundColor Green
    } else {
        Write-Host 'Creating the ECKEY THUMP v1.2 commit...' -ForegroundColor Cyan
        & git -C $repoDir commit -m 'Update ECKEY THUMP to v1.2 seaside postcard and Chaos Mode'
        if ($LASTEXITCODE -ne 0) {throw 'Commit failed. Configure your Git name/email in Git for Windows or GitHub Desktop.'}
        Write-Host 'Uploading to GitHub; Git may open a sign-in window...' -ForegroundColor Cyan
        & git -C $repoDir push origin main
        if ($LASTEXITCODE -ne 0) {throw ('Push failed. Open '+$repoLink+' and check your access/branch rules. Temporary copy: '+$repoDir)}
    }
    Write-Host ('SUCCESS: '+$repoLink) -ForegroundColor Green
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
    exit 0
}
catch {
    Write-Host ('ERROR: '+$_.Exception.Message) -ForegroundColor Red
    if(Test-Path $work) {Write-Host ('Temporary working folder: '+$work)}
    exit 1
}
