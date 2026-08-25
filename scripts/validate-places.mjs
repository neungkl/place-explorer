#!/usr/bin/env node
// Structural validation of data/places.json against data/places.schema.json.
// Semantic checks (month coverage, tier-band ladder, precision-vs-tier rule,
// tag-registry membership) land in phase 2+ alongside the filter logic they share.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, "..", "data");

const schema = JSON.parse(readFileSync(path.join(dataDir, "places.schema.json"), "utf-8"));
const places = JSON.parse(readFileSync(path.join(dataDir, "places.json"), "utf-8"));

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(places)) {
  console.error(`places.json failed schema validation (${validate.errors.length} error(s)):`);
  for (const err of validate.errors) {
    console.error(`  ${err.instancePath || "/"} ${err.message}`);
  }
  process.exit(1);
}

console.log(`places.json is valid (${places.length} place(s)).`);
