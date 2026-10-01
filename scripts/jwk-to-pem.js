import { createPublicKey } from "node:crypto";

const port = process.env.PORT || 3000;

const res = await fetch(`http://localhost:${port}/jwks`);

const { keys } = await res.json();

const key = keys[0];
console.log(`kid: ${key.kid}\n`);

const pem = createPublicKey({ key, format: "jwk" }).export({
  type: "spki",
  format: "pem",
});
console.log(pem);
