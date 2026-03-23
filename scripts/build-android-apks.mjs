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
  console.error("Missing APP_BASE_URL. Example: APP_BASE_URL=http://82.156.84.170 npm run android:apk:variants");
  process.exit(1);
}

const baseUrl = baseUrlInput.replace(/\/+$/, "");

const capacitorConfigPath = path.join(rootDir, "capacitor.config.json");
const buildGradlePath = path.join(androidDir, "app", "build.gradle");
const stringsXmlPath = path.join(
  androidDir,
  "app",
  "src",
  "main",
  "res",
  "values",
  "strings.xml"
);

const originalCapacitorConfig = fs.readFileSync(capacitorConfigPath, "utf8");
const originalBuildGradle = fs.readFileSync(buildGradlePath, "utf8");
const originalStringsXml = fs.readFileSync(stringsXmlPath, "utf8");

const variants = [
  {
    slug: "member",
    appId: "com.moodalbum.member",
    appName: "MoodAlbum记录端",
    entryPath: "",
  },
  {
    slug: "care",
    appId: "com.moodalbum.care",
    appName: "MoodAlbum回复端",
    entryPath: "/care",
  },
];

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

function replaceOrThrow(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Unable to update ${label}`);
  }

  return source.replace(pattern, replacement);
}

function applyVariant(variant) {
  const config = JSON.parse(originalCapacitorConfig);
  config.appId = variant.appId;
  config.appName = variant.appName;
  config.server = {
    ...(config.server || {}),
    url: `${baseUrl}${variant.entryPath}`,
    cleartext: true,
  };
  fs.writeFileSync(capacitorConfigPath, `${JSON.stringify(config, null, 2)}\n`);

  const nextBuildGradle = replaceOrThrow(
    originalBuildGradle,
    /applicationId\s+"[^"]+"/,
    `applicationId "${variant.appId}"`,
    "android applicationId"
  );
  fs.writeFileSync(buildGradlePath, nextBuildGradle);

  let nextStringsXml = replaceOrThrow(
    originalStringsXml,
    /<string name="app_name">[^<]*<\/string>/,
    `<string name="app_name">${variant.appName}</string>`,
    "android app_name"
  );
  nextStringsXml = replaceOrThrow(
    nextStringsXml,
    /<string name="title_activity_main">[^<]*<\/string>/,
    `<string name="title_activity_main">${variant.appName}</string>`,
    "android title_activity_main"
  );
  nextStringsXml = replaceOrThrow(
    nextStringsXml,
    /<string name="package_name">[^<]*<\/string>/,
    `<string name="package_name">${variant.appId}</string>`,
    "android package_name"
  );
  nextStringsXml = replaceOrThrow(
    nextStringsXml,
    /<string name="custom_url_scheme">[^<]*<\/string>/,
    `<string name="custom_url_scheme">${variant.appId}</string>`,
    "android custom_url_scheme"
  );
  fs.writeFileSync(stringsXmlPath, nextStringsXml);
}

function restoreOriginalFiles() {
  fs.writeFileSync(capacitorConfigPath, originalCapacitorConfig);
  fs.writeFileSync(buildGradlePath, originalBuildGradle);
  fs.writeFileSync(stringsXmlPath, originalStringsXml);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.chmodSync(path.join(androidDir, "gradlew"), 0o755);

try {
  run("npm", ["run", "build"]);

  for (const variant of variants) {
    applyVariant(variant);
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
    const targetApkPath = path.join(outputDir, `MoodAlbum-${variant.slug}-debug.apk`);
    fs.copyFileSync(sourceApkPath, targetApkPath);
    console.log(`Saved ${targetApkPath}`);
  }
} finally {
  restoreOriginalFiles();
  run("npx", ["cap", "sync", "android"]);
}
