import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 3000;

export const config = {
  port,
  issuer: process.env.ISSUER || `http://localhost:${port}`,
  keysPath: path.join(root, "keys", "jwks.json"),
  clients: [
    {
      client_id: "test-client",
      client_secret: "test-secret",
      redirect_uris: ["https://oidcdebugger.com/debug"],
      response_types: ["code"],
      grant_types: ["authorization_code"],
      token_endpoint_auth_method: "client_secret_basic",
    },
  ],
  claims: {
    openid: ["sub"],
    email: ["email", "email_verified"],
    profile: ["name"],
  },
};
