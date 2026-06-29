#!/usr/bin/env node
/**
 * Generate TypeScript types from the FastAPI OpenAPI schema.
 *
 * Usage:
 *   OPENAPI_URL=http://localhost:8000/openapi.json npm run generate:api-types
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const openapiUrl = process.env.OPENAPI_URL || "http://localhost:8000/openapi.json";
const outFile = path.join(root, "shared/generated-openapi.ts");

async function main() {
  const response = await fetch(openapiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI schema from ${openapiUrl} (${response.status})`);
  }

  const schema = await response.json();
  const tmpFile = path.join(root, ".openapi-tmp.json");
  fs.writeFileSync(tmpFile, JSON.stringify(schema, null, 2));

  execSync(`npx openapi-typescript "${tmpFile}" -o "${outFile}"`, {
    cwd: root,
    stdio: "inherit",
  });

  fs.unlinkSync(tmpFile);
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
