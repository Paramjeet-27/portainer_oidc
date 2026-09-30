import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const keysDir = path.join(root, "keys");

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = privateKey.export({ format: "jwk" });

const key = {
  ...jwk,
  kid: `key-${new Date().toISOString().slice(0, 10)}`,
  use: "sig",
  alg: "RS256",
};

mkdirSync(keysDir, { recursive: true });
writeFileSync(
  path.join(keysDir, "jwks.json"),
  JSON.stringify({ keys: [key] }, null, 2),
);
console.log(`Wrote keys/jwks.json with kid ${key.kid}`);
