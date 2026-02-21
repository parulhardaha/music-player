# Building a standalone Android APK

The app is built as a **standalone APK**: the JavaScript bundle is embedded inside the APK. You do **not** need Expo, Metro, or a dev server on your phone or computer to run it. Install the APK on your device and open it like any other app.

---

## Option 1: Local build (needs Java)

1. **Install JDK 17** (if not already):
   ```bash
   brew install openjdk@17
   ```
   Then add to your `~/.zshrc` (or run in the terminal for this session):
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   ```

2. **Build the standalone APK**:
   ```bash
   npm run android:apk
   ```
   This builds a **release** APK (optimized, no Metro/Expo required).

3. **Find the APK**:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```
   Copy this file to your Android phone (e.g. via USB, Google Drive, or email) and open it to install.

   For a **debug** build (e.g. for testing) use `npm run android:apk:debug`; the file will be at `android/app/build/outputs/apk/debug/app-debug.apk`. Debug builds are also standalone (no Metro needed).

---

## Option 2: Cloud build with EAS (no Java needed)

1. **Install EAS CLI and log in** (one-time):
   ```bash
   npm install -g eas-cli
   eas login
   ```
   Use or create a free [Expo](https://expo.dev) account.

2. **Build in the cloud**:
   ```bash
   npm run android:apk:eas
   ```
   or:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

3. When the build finishes, the CLI prints a **download link** for the APK. Open that link on your phone (or download on your computer and transfer the file) and install. The APK is standalone; no Expo or Metro is required on the device.
