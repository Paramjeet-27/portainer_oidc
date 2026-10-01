import Provider from "oidc-provider";
import { readFileSync } from "node:fs";
import { config } from "./config.js";
import { findAccount } from "./accounts.js";

const jwks = JSON.parse(readFileSync(config.keysPath, "utf8"));

export const oidc = new Provider(config.issuer, {
  jwks,
  clients: config.clients,
  findAccount,
  claims: config.claims,
  // conformIdTokenClaims: false,
  pkce: {
    required: () => true,
  },
});

// if conformIdTokenClaims is 'false', the user info requested in claims will be added in id_token, else only sub will be added, default is 'true'
