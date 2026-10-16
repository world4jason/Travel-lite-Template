/**
 * Zero-dependency validator for the JSON Schema subset used by Style Brief v1.
 * The JSON Schema remains the source of truth. This is a focused validator, not
 * a general replacement for Ajv; it rejects all unknown properties and values.
 *
 * Supported: $ref (local), type, const, enum, required, properties,
 * additionalProperties, items, minItems, maxItems, uniqueItems, minLength,
 * maxLength, pattern, minimum, maximum.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const schema = JSON.parse(
  readFileSync(new URL("./style.schema.json", import.meta.url), "utf8")
);

function typeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return typeof value === type;
}

function check(value, rule, where, errors) {
  if (rule.$ref) {
    if (!rule.$ref.startsWith("#/$defs/")) throw new Error("Only local $defs refs are supported.");
    const key = rule.$ref.slice("#/$defs/".length);
    if (!schema.$defs[key]) throw new Error("Unknown schema ref " + rule.$ref);
    return check(value, schema.$defs[key], where, errors);
  }

  if (rule.if) {
    const conditionErrors = [];
    check(value, rule.if, where, conditionErrors);
    if (!conditionErrors.length && rule.then) check(value, rule.then, where, errors);
  }

  if (rule.type) {
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (!types.some(type => typeMatches(value, type))) {
      errors.push(where + ": expected " + types.join("|"));
      return;
    }
  }
  if (Object.hasOwn(rule, "const") && JSON.stringify(value) !== JSON.stringify(rule.const)) {
    errors.push(where + ": must equal " + JSON.stringify(rule.const));
  }
  if (rule.enum && !rule.enum.some(option => JSON.stringify(option) === JSON.stringify(value))) {
    errors.push(where + ": not an allowed enum value");
  }

  if (typeof value === "string") {
    if (rule.minLength != null && value.length < rule.minLength) errors.push(where + ": string too short");
    if (rule.maxLength != null && value.length > rule.maxLength) errors.push(where + ": string too long");
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) errors.push(where + ": pattern mismatch");
  }

  if (typeof value === "number") {
    if (rule.minimum != null && value < rule.minimum) errors.push(where + ": below minimum");
    if (rule.maximum != null && value > rule.maximum) errors.push(where + ": above maximum");
  }

  if (Array.isArray(value)) {
    if (rule.minItems != null && value.length < rule.minItems) errors.push(where + ": too few items");
    if (rule.maxItems != null && value.length > rule.maxItems) errors.push(where + ": too many items");
    if (rule.uniqueItems && new Set(value.map(x => JSON.stringify(x))).size !== value.length) {
      errors.push(where + ": duplicate items");
    }
    if (rule.items) value.forEach((item, index) => check(item, rule.items, where + "[" + index + "]", errors));
  }

  if (typeMatches(value, "object")) {
    for (const key of rule.required || []) {
      if (!Object.hasOwn(value, key)) errors.push(where + "." + key + ": missing required property");
    }
    if (rule.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(rule.properties || {}, key)) errors.push(where + "." + key + ": unknown property");
      }
    }
    for (const [key, childRule] of Object.entries(rule.properties || {})) {
      if (Object.hasOwn(value, key)) check(value[key], childRule, where + "." + key, errors);
    }
  }
}

export function validateStyleBrief(value) {
  const errors = [];
  check(value, schema, "$", errors);
  if (errors.length) return { valid: false, errors };

  // A few semantic invariants cannot be expressed by this schema's simple fields.
  // Schema if/then enforces Frame Grammar for v1.1 and preserves v1.0 briefs.
  const frame = value.visual.frameAndOrnament;
  if (frame && ["none", "unknown"].includes(frame.role) &&
      (frame.frameLayers.length || frame.cornerMotifs.length || frame.dividerMotifs.length || frame.labelFrames.length)) {
    errors.push("$.visual.frameAndOrnament: role none/unknown cannot invent decorative border components");
  }
  const colors = value.visual.palette;
  if (colors.mode === "fixed" && colors.maxColors !== colors.swatches.length) {
    errors.push("$.visual.palette: fixed palette count must equal the swatch count");
  }
  if (colors.maxColors !== null && colors.swatches.length > colors.maxColors) {
    errors.push("$.visual.palette: swatches exceed the color budget");
  }
  if (value.audit.photoProvided !== (value.audit.basis === "text-and-image")) {
    errors.push("$.audit: photoProvided and basis must agree");
  }
  if (value.webTranslation.implementationTier === "token-variant" &&
      value.webTranslation.recommendedBase === "new-style-pack") {
    errors.push("$.webTranslation: token-only variation cannot also demand a new pack");
  }
  return { valid: errors.length === 0, errors };
}

function inputFiles(args) {
  const paths = args.length ? args : ["style-generator/examples"];
  return paths.flatMap(path => {
    const absolute = resolve(path);
    if (statSync(absolute).isDirectory()) {
      return readdirSync(absolute).filter(name => extname(name) === ".json")
        .sort().map(name => resolve(absolute, name));
    }
    return [absolute];
  });
}

// Invoked directly as a small CLI. This does not generate style specs.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  let passed = 0;
  let failed = 0;
  for (const file of inputFiles(process.argv.slice(2))) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      const result = validateStyleBrief(parsed);
      if (!result.valid) {
        failed += 1;
        process.stderr.write("FAIL " + file + "\n" + result.errors.join("\n") + "\n");
      } else {
        passed += 1;
        process.stdout.write("PASS " + file + " [" + parsed.stage + "]\n");
      }
    } catch (error) {
      failed += 1;
      process.stderr.write("FAIL " + file + ": " + error.message + "\n");
    }
  }
  process.stdout.write("Style Briefs: " + passed + " passed, " + failed + " failed.\n");
  if (failed) process.exitCode = 1;
}
