@echo off
setlocal

if not defined JAVA_HOME (
  echo ERROR: 请先设置 JAVA_HOME 环境变量（例如 JDK 21）
  exit /b 1
)
if not defined ANDROID_SDK_ROOT (
  if defined ANDROID_HOME (
    set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
  ) else (
    echo ERROR: 请先设置 ANDROID_SDK_ROOT 或 ANDROID_HOME 环境变量
    exit /b 1
  )
)

set "PATH=%JAVA_HOME%\bin;%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\cmdline-tools\latest\bin;%PATH%"

call npm run build
if errorlevel 1 exit /b 1

call npx cap sync android
if errorlevel 1 exit /b 1

cd /d "%~dp0..\android"
call gradlew.bat assembleDebug
if errorlevel 1 exit /b 1

copy /Y "%~dp0..\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0..\MoodAlbum-debug.apk" >nul
