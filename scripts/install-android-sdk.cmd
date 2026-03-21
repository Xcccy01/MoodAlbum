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

set "PATH=%JAVA_HOME%\bin;%ANDROID_SDK_ROOT%\cmdline-tools\latest\bin;%PATH%"

if not exist "%ANDROID_SDK_ROOT%\licenses" mkdir "%ANDROID_SDK_ROOT%\licenses"
> "%ANDROID_SDK_ROOT%\licenses\android-sdk-license" (
  echo 24333f8a63b6825ea9c5514f83c2829b004d1fee
  echo d56f5187479451eabf01fb78af6dfcb131a6481e
)
> "%ANDROID_SDK_ROOT%\licenses\android-sdk-preview-license" (
  echo 84831b9409646a918e30573bab4c9c91346d8abd
)

call sdkmanager.bat --sdk_root=%ANDROID_SDK_ROOT% "platform-tools" "platforms;android-36" "build-tools;36.0.0"
if errorlevel 1 exit /b 1
