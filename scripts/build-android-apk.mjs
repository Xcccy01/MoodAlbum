import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const androidDir = path.join(rootDir, "android");
const outputDir = path.resolve(
  process.env.APK_OUTPUT_DIR || path.join(rootDir, "..", "apk-output")
);

const baseUrlInput = process.env.APP_BASE_URL || process.argv[2];

if (!baseUrlInput) {
  console.error("Missing APP_BASE_URL. Example: APP_BASE_URL=http://82.156.84.170 npm run android:apk");
  process.exit(1);
}

const baseUrl = baseUrlInput.replace(/\/+$/, "");
const capacitorConfigPath = path.join(rootDir, "capacitor.config.json");
const originalCapacitorConfig = fs.readFileSync(capacitorConfigPath, "utf8");

const buildEnv = {
  ...process.env,
  ANDROID_HOME: process.env.ANDROID_HOME || path.join(process.env.HOME || "", "Library", "Android", "sdk"),
  ANDROID_SDK_ROOT:
    process.env.ANDROID_SDK_ROOT || path.join(process.env.HOME || "", "Library", "Android", "sdk"),
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: buildEnv,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status || 1}`);
  }
}

function applyServerUrl() {
  const config = JSON.parse(originalCapacitorConfig);
  config.server = {
    ...(config.server || {}),
    url: baseUrl,
    cleartext: true,
  };
  fs.writeFileSync(capacitorConfigPath, `${JSON.stringify(config, null, 2)}\n`);
}

function restoreConfig() {
  fs.writeFileSync(capacitorConfigPath, originalCapacitorConfig);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.chmodSync(path.join(androidDir, "gradlew"), 0o755);

try {
  run("npm", ["run", "build"]);
  applyServerUrl();
  run("npx", ["cap", "sync", "android"]);
  run("./gradlew", ["assembleDebug"], { cwd: androidDir });

  const sourceApkPath = path.join(
    androidDir,
    "app",
    "build",
    "outputs",
    "apk",
    "debug",
    "app-debug.apk"
  );
  const targetApkPath = path.join(outputDir, "MoodAlbum-debug.apk");
  fs.copyFileSync(sourceApkPath, targetApkPath);
  console.log(`Saved ${targetApkPath}`);
} finally {
  restoreConfig();
  run("npx", ["cap", "sync", "android"]);
}
