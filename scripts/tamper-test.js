import "dotenv/config";
import { createPublicKey, createVerify } from "node:crypto";

const token = process.argv[2];
if (!token) {
  console.error("Usage: npm run tamper-test -- <id_token>");
  process.exit(1);
}

const [header, payload, signature] = token.split(".");

const port = process.env.PORT || 3000;

const res = await fetch(`http://localhost:${port}/jwks`);
const { keys } = await res.json();
const publicKey = createPublicKey({ key: keys[0], format: "jwk" });

const verify = (h, p, s) =>
  createVerify("RSA-SHA256")
    .update(`${h}.${p}`)
    .verify(publicKey, s, "base64url");

console.log("original token valid:", verify(header, payload, signature));

const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
claims.sub = "admin";
const forgedPayload = Buffer.from(JSON.stringify(claims)).toString("base64url");

console.log("tampered token valid:", verify(header, forgedPayload, signature));
