@echo off
echo ===================================================
echo     PLACEBOO - PROSES BUILD FILE APK ANDROID
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/2] Memeriksa Login Expo...
call npx.cmd eas-cli whoami
if %ERRORLEVEL% neq 0 (
    echo.
    echo Anda belum login ke akun Expo.
    echo Silakan masukkan Username/Email dan Password akun expo.dev Anda di bawah:
    echo (Jika belum punya akun, daftar gratis di https://expo.dev/signup)
    echo.
    call npx.cmd eas-cli login
)

echo.
echo [2/2] Memulai Cloud Build APK Android...
echo Server Expo akan memproses dan mengkompilasi file .apk mandiri.
echo.
call npx.cmd eas-cli build --platform android --profile preview

echo.
echo ===================================================
echo Selesai! Silakan download file .apk dari link di atas.
echo ===================================================
pause
