import { generateKeyPairSync, createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = privateKey.export({ format: "jwk" });

// RFC 7638: SHA-256 over the required members, in alphabetical order
const kid = createHash("sha256")
  .update(JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n }))
  .digest("base64url");

const key = { ...jwk, use: "sig", alg: "RS256", kid };

mkdirSync("keys", { recursive: true });
writeFileSync("keys/jwks.json", JSON.stringify({ keys: [key] }, null, 2));
console.log("kid:", kid);
