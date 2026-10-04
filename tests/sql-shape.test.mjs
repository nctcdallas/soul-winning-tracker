import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../netlify/functions/journey-v2.mjs", import.meta.url), "utf8");
const insert = source.match(/INSERT INTO journeys \(([\s\S]*?)\)\s*VALUES \(([\s\S]*?)\)\s*RETURNING id/);
assert.ok(insert, "journeys INSERT statement exists");
const columns = insert[1].split(",").map(column => column.trim());
const values = [...insert[2].matchAll(/\$\{/g)];
assert.equal(values.length, columns.length, "journeys INSERT supplies one value per column");
assert.match(insert[2], /\$\{location\},\s*CAST\(\$\{encounterDate\} AS DATE\)/, "location precedes encounter date");
console.log("Journey INSERT columns and values match.");
