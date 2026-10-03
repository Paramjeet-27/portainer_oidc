import Provider, { errors } from "oidc-provider";
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
  features: {
    resourceIndicators: {
      // defaultResource: async () => config.apiResource,
      getResourceServerInfo: async (ctx, resourceIndicator, client) => {
        if (resourceIndicator !== config.apiResource) {
          console.log("Resource URL mismatch. Throwing error...");
          throw new errors.InvalidTarget();
        }
        console.log("Resource URL matched. Proceeding");
        return {
          scope: "api:read",
          accessTokenFormat: "jwt",
          accessTokenTTL: 3600,
        };
      },
    },
  },
});

// if conformIdTokenClaims is 'false', the user info requested in claims will be added in id_token, else only sub will be added, default is 'true'

// logging events and errors

const EVENTS = [
  "authorization.success",
  "authorization.error",
  "authorization_code.saved",
  "authorization_code.consumed",
  "grant.success",
  "grant.error",
  "userinfo.error",
  "server_error",
];

const logEvent = (event) => (ctx, err) => {
  const parts = [`[${event}]`];

  const client = ctx?.oidc?.client?.clientId;
  if (client) parts.push(`client=${client}`);

  const isError = event.endsWith("error");
  if (isError && err) {
    parts.push(
      `${err.error || err.name}: ${err.error_description || err.message}`,
    );
    if (err.error_detail) parts.push(`| detail: ${err.error_detail}`);
  }

  (event.endsWith("error") ? console.error : console.log)(parts.join(" "));
};

for (const event of EVENTS) oidc.on(event, logEvent(event));
