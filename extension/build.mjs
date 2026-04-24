import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "fs";

const watch = process.argv.includes("--watch");

const sharedConfig = {
  bundle: true,
  minify: !watch,
  sourcemap: watch,
  target: "chrome120",
};

async function build() {
  await Promise.all([
    esbuild.build({
      ...sharedConfig,
      entryPoints: ["src/popup.ts"],
      outfile: "dist/popup.js",
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

  mkdirSync("dist", { recursive: true });
  copyFileSync("public/popup.html", "dist/popup.html");
  copyFileSync("manifest.json", "dist/manifest.json");
  if (!watch) console.log("Build complete.");
}

if (watch) {
  const contexts = await Promise.all([
    esbuild.context({ ...sharedConfig, entryPoints: ["src/popup.ts"], outfile: "dist/popup.js" }),
    esbuild.context({ ...sharedConfig, entryPoints: ["src/background.ts"], outfile: "dist/background.js" }),
    esbuild.context({ ...sharedConfig, entryPoints: ["src/content.ts"], outfile: "dist/content.js" }),
  ]);
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("Watching...");
} else {
  build();
}
