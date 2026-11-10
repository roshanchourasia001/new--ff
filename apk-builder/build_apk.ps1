# Free Fire Esports Tournament Standalone APK Compiler
# Uses bundled OpenJDK from Android Studio and Android SDK Build-Tools

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

$buildTools = "C:\Users\rosha\AppData\Local\Android\Sdk\build-tools\36.0.0"
$androidJar = "C:\Users\rosha\AppData\Local\Android\Sdk\platforms\android-34\android.jar"

Set-Location -Path $PSScriptRoot

Write-Host "=========================================="
Write-Host "BUILDING FREE FIRE ESPORTS PRODUCTION APK"
Write-Host "=========================================="

Write-Host "--- 1. Cleaning build folders ---"
Remove-Item -Recurse -Force build\bin\*, build\gen\*, build\obj\* -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path build\bin, build\gen, build\obj | Out-Null

Write-Host "--- 2. Generating R.java with aapt ---"
& "$buildTools\aapt.exe" package -f -m -J build\gen -M AndroidManifest.xml -S res -I $androidJar
if ($LASTEXITCODE -ne 0) { 
    Write-Error "aapt package failed!"
    exit 1 
}

Write-Host "--- 3. Compiling Java sources with javac --release 8 ---"
$javaFiles = Get-ChildItem -Recurse -Filter *.java src, build\gen | Select-Object -ExpandProperty FullName
& "$env:JAVA_HOME\bin\javac.exe" --release 8 -d build\obj -cp $androidJar $javaFiles
if ($LASTEXITCODE -ne 0) { 
    Write-Error "javac compilation failed!"
    exit 1 
}

Write-Host "--- 4. Translating class files to classes.dex with d8 ---"
$classFiles = Get-ChildItem -Recurse -Filter *.class build\obj | Select-Object -ExpandProperty FullName
& "$buildTools\d8.bat" --lib $androidJar --output build\bin\ $classFiles
if ($LASTEXITCODE -ne 0) { 
    Write-Error "d8 conversion failed!"
    exit 1 
}

Write-Host "--- 5. Packaging assets and resources into unsigned APK ---"
& "$buildTools\aapt.exe" package -f -M AndroidManifest.xml -S res -A assets -I $androidJar -F build\bin\app.unsigned.apk
if ($LASTEXITCODE -ne 0) { 
    Write-Error "aapt assets package failed!"
    exit 1 
}

Write-Host "--- 6. Adding classes.dex to APK ---"
Set-Location build\bin
& "$buildTools\aapt.exe" add app.unsigned.apk classes.dex
if ($LASTEXITCODE -ne 0) { 
    Write-Error "Failed to add classes.dex!"
    exit 1 
}
Set-Location ..\..

Write-Host "--- 7. Aligning APK with zipalign 4 ---"
& "$buildTools\zipalign.exe" -p -f 4 build\bin\app.unsigned.apk build\bin\app.aligned.apk
if ($LASTEXITCODE -ne 0) { 
    Write-Error "zipalign failed!"
    exit 1 
}

Write-Host "--- 8. Checking keystore ---"
if (-not (Test-Path release.keystore)) {
    & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -keystore release.keystore -alias ffesports -keyalg RSA -keysize 2048 -validity 10000 -storepass ffesports123 -keypass ffesports123 -dname "CN=FFEsports, OU=Gaming, O=FFEsports, L=NewDelhi, ST=Delhi, C=IN"
}

Write-Host "--- 9. Signing APK with apksigner (v1 + v2 + v3) ---"
& "$buildTools\apksigner.bat" sign --ks release.keystore --ks-pass pass:ffesports123 --key-pass pass:ffesports123 --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --out build\bin\FreeFire-Esports-release.apk build\bin\app.aligned.apk
if ($LASTEXITCODE -ne 0) { 
    Write-Error "apksigner failed!"
    exit 1 
}

Write-Host "--- 10. Verifying signatures ---"
& "$buildTools\apksigner.bat" verify --verbose build\bin\FreeFire-Esports-release.apk
if ($LASTEXITCODE -ne 0) { 
    Write-Error "Signature verification failed!"
    exit 1 
}

Write-Host "--- 11. Publishing APK to root and Downloads ---"
Copy-Item -Force build\bin\FreeFire-Esports-release.apk "..\FreeFire-Esports-release.apk"
Copy-Item -Force build\bin\FreeFire-Esports-release.apk "C:\Users\rosha\Downloads\FreeFire-Esports-release.apk"

Write-Host "--- 12. Dumping package badging ---"
& "$buildTools\aapt.exe" dump badging build\bin\FreeFire-Esports-release.apk | Select-String "package: name="

Write-Host "=========================================="
Write-Host "PRODUCTION APK COMPILED & SIGNED SUCCESSFULLY!"
Write-Host "Output: FreeFire-Esports-release.apk"
Write-Host "=========================================="
