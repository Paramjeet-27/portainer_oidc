import { generateKeyPairSync, createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "keys/jwks.json";
const [cmd, arg] = process.argv.slice(2);
const { keys } = JSON.parse(readFileSync(FILE, "utf8"));

const newKey = () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = privateKey.export({ format: "jwk" });
  const kid = createHash("sha256")
    .update(JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n }))
    .digest("base64url");
  return { ...jwk, use: "sig", alg: "RS256", kid };
};

if (cmd === "add") {
  keys.push(newKey()); // published, but NOT signing yet
} else if (cmd === "promote") {
  const i = keys.findIndex((k) => k.kid === arg);
  if (i < 0) throw new Error("kid not found");
  keys.unshift(...keys.splice(i, 1)); // move to front = becomes signing key
} else if (cmd === "retire") {
  if (keys[0].kid === arg)
    throw new Error("refusing to retire the signing key");
  const rest = keys.filter((k) => k.kid !== arg);
  if (rest.length === keys.length) throw new Error("kid not found");
  keys.splice(0, keys.length, ...rest);
} else if (cmd !== "list") {
  throw new Error("usage: add | promote <kid> | retire <kid> | list");
}

writeFileSync(FILE, JSON.stringify({ keys }, null, 2));
keys.forEach((k, i) =>
  console.log(i === 0 ? "signing ->" : "published ->", k.kid),
);
