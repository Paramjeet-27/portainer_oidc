import { createPublicKey } from "node:crypto";

const res = await fetch("http://localhost:3000/jwks");
const { keys } = await res.json();

const key = keys[0];
console.log(`kid: ${key.kid}\n`);

const pem = createPublicKey({ key, format: "jwk" }).export({
  type: "spki",
  format: "pem",
});
console.log(pem);
