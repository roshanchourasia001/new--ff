$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
# Reuse the existing signing key, so this remains an update to the installed app.
$legacyBuild = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'build_apk.ps1') -Raw
$signPassword = [regex]::Match($legacyBuild, '-storepass ([^ ]+)').Groups[1].Value
if (!$signPassword) { throw 'Existing signing password unavailable' }
$env:ORG_GRADLE_PROJECT_FF_STORE_PASSWORD = $signPassword
$env:ORG_GRADLE_PROJECT_FF_KEY_PASSWORD = $signPassword
try {
    $gradle = Get-ChildItem -LiteralPath (Join-Path $env:USERPROFILE '.gradle\wrapper\dists\gradle-9.3.1-all') -Recurse -Filter gradle.bat | Select-Object -First 1
    if (!$gradle) { throw 'Gradle 9.3.1 is required' }
    & $gradle.FullName assembleRelease
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed' }
    $apk = Get-ChildItem -LiteralPath 'build\outputs\apk\release' -Filter '*.apk' | Select-Object -First 1
    if (!$apk) { throw 'Release APK not found' }
    Copy-Item -LiteralPath $apk.FullName -Destination '..\FreeFire-Esports-release.apk' -Force
} finally {
    Remove-Item Env:\ORG_GRADLE_PROJECT_FF_STORE_PASSWORD,Env:\ORG_GRADLE_PROJECT_FF_KEY_PASSWORD -ErrorAction SilentlyContinue
}
