import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 3000;

export const config = {
  port,
  issuer: process.env.ISSUER || `http://localhost:${port}`,
  apiResource: "http://abc.com/some_api",
  keysPath: path.join(root, "keys", "jwks.json"),
  usersPath: path.join(root, "data", "users.json"),
  clients: [
    {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: [
        "https://oidcdebugger.com/debug",
        "https://my-test-redirect.com",
      ],
      response_types: ["code"],
      grant_types: ["authorization_code"],
      token_endpoint_auth_method: "client_secret_basic",
    },
  ],
  claims: {
    openid: ["sub"],
    email: ["email"],
    profile: ["name", "address", "email_verified"],
  },
};
