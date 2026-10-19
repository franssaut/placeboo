@echo off
echo ===================================================
echo     PLACEBOO - PROSES BUILD AAB (PLAY STORE)
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/2] Memeriksa Login Expo...
call npx.cmd eas-cli whoami
if %ERRORLEVEL% neq 0 (
    echo.
    echo Anda belum login ke akun Expo.
    echo Silakan masukkan Username/Email dan Password akun expo.dev Anda di bawah:
    echo.
    call npx.cmd eas-cli login
)

echo.
echo [2/2] Memulai Cloud Build Android App Bundle (.aab)...
echo Server Expo akan memproses dan menandatangani file .aab untuk Play Store.
echo.
call npx.cmd eas-cli build --platform android --profile production

echo.
echo ===================================================
echo Selesai! Silakan download file .aab untuk diupload ke Play Store.
echo ===================================================
pause
