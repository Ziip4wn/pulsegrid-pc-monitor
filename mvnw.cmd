@echo off
setlocal
set "MAVEN_VERSION=3.9.9"
set "SCRIPT_DIR=%~dp0"
set "MAVEN_DIR=%SCRIPT_DIR%.mvn\apache-maven-%MAVEN_VERSION%"

if not exist "%MAVEN_DIR%\bin\mvn.cmd" (
  echo Telechargement de Maven %MAVEN_VERSION%...
  if not exist "%SCRIPT_DIR%.mvn" mkdir "%SCRIPT_DIR%.mvn"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; $zip=Join-Path $env:TEMP 'pulsegrid-maven.zip'; Invoke-WebRequest 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile $zip; Expand-Archive -Path $zip -DestinationPath '%SCRIPT_DIR%.mvn' -Force; Remove-Item $zip"
  if errorlevel 1 exit /b 1
)

call "%MAVEN_DIR%\bin\mvn.cmd" %*
exit /b %errorlevel%

