// Node rather than rm and cp, so the build that runs on a git install also
// runs under cmd.exe.
import { execFileSync } from "node:child_process";
import { cpSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

rmSync("dist", { recursive: true, force: true });
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.build.json"], {
  stdio: "inherit",
});

// Each component's stylesheet ships beside its code, with an empty
// declaration so `import "…/x.css"` typechecks without a bundler's own.
for (const dir of readdirSync("src", { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  for (const file of readdirSync(join("src", dir.name))) {
    if (!file.endsWith(".css")) continue;
    cpSync(join("src", dir.name, file), join("dist", dir.name, file));
    writeFileSync(join("dist", dir.name, `${file}.d.ts`), "export {};\n");
  }
}
