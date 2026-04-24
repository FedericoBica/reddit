const Module = require("module");
const path = require("path");
const fs = require("fs");

const repoRoot = process.cwd();
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request === "server-only") {
    request = path.join(repoRoot, "scripts", "server-only-stub.cjs");
  }

  if (typeof request === "string" && request.startsWith("@/")) {
    const suffix = request.slice(2);
    const candidates = [
      path.join(repoRoot, ".test-dist", "outbound-integration", "src", suffix),
      path.join(repoRoot, ".test-dist", "outbound", "src", suffix),
      path.join(repoRoot, "src", suffix),
      path.join(repoRoot, suffix),
    ];

    const resolved = candidates.find((candidate) => {
      return (
        fs.existsSync(candidate) ||
        fs.existsSync(`${candidate}.js`) ||
        fs.existsSync(`${candidate}.cjs`) ||
        fs.existsSync(`${candidate}.mjs`) ||
        fs.existsSync(`${candidate}.ts`)
      );
    });

    request = resolved ?? candidates[0];
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
