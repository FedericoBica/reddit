import * as esbuild from "esbuild";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";

const watch = process.argv.includes("--watch");
const iconSizes = [16, 32, 48, 128];
const apiBaseUrl = process.env.EXTENSION_BASE_URL || "https://reddprowl.com";

const sharedConfig = {
  bundle: true,
  define: {
    __API_BASE_URL__: JSON.stringify(apiBaseUrl),
  },
  minify: !watch,
  sourcemap: watch,
  target: "chrome120",
};

function copyStaticAssets() {
  mkdirSync("dist", { recursive: true });

  if (!existsSync("public/popup.html")) {
    throw new Error("Missing extension/public/popup.html");
  }
  if (!existsSync("public/sidepanel.html")) {
    throw new Error("Missing extension/public/sidepanel.html");
  }
  if (!existsSync("public/page-context.js")) {
    throw new Error("Missing extension/public/page-context.js");
  }
  if (!existsSync("manifest.json")) {
    throw new Error("Missing extension/manifest.json");
  }

  copyFileSync("public/popup.html", "dist/popup.html");
  copyFileSync("public/sidepanel.html", "dist/sidepanel.html");
  copyFileSync("public/page-context.js", "dist/page-context.js");
  const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  const apiOrigin = new URL(apiBaseUrl).origin;
  const apiPermission = `${apiOrigin}/*`;
  manifest.host_permissions = Array.from(
    new Set([...(manifest.host_permissions ?? []), apiPermission]),
  );
  writeFileSync("dist/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

  mkdirSync("dist/icons", { recursive: true });
  for (const size of iconSizes) {
    const source = `public/icons/icon-${size}.png`;
    if (!existsSync(source)) {
      throw new Error(`Missing extension icon asset: ${source}. Run \`npm run extension:icons\` from repo root.`);
    }
    copyFileSync(source, `dist/icons/icon-${size}.png`);
  }
}

async function build() {
  rmSync("dist", { recursive: true, force: true });
  copyStaticAssets();

  await Promise.all([
    esbuild.build({
      ...sharedConfig,
      entryPoints: ["src/popup.ts"],
      outfile: "dist/popup.js",
    }),
    esbuild.build({
      ...sharedConfig,
      entryPoints: ["src/sidepanel.ts"],
      outfile: "dist/sidepanel.js",
    }),
    esbuild.build({
      ...sharedConfig,
      entryPoints: ["src/background.ts"],
      outfile: "dist/background.js",
    }),
    esbuild.build({
      ...sharedConfig,
      entryPoints: ["src/content.ts"],
      outfile: "dist/content.js",
    }),
  ]);

  if (!watch) console.log("Build complete.");
}

if (watch) {
  rmSync("dist", { recursive: true, force: true });
  copyStaticAssets();

  const contexts = await Promise.all([
    esbuild.context({ ...sharedConfig, entryPoints: ["src/popup.ts"], outfile: "dist/popup.js" }),
    esbuild.context({ ...sharedConfig, entryPoints: ["src/sidepanel.ts"], outfile: "dist/sidepanel.js" }),
    esbuild.context({ ...sharedConfig, entryPoints: ["src/background.ts"], outfile: "dist/background.js" }),
    esbuild.context({ ...sharedConfig, entryPoints: ["src/content.ts"], outfile: "dist/content.js" }),
  ]);
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("Watching...");
} else {
  await build();
}
