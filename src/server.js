import { oidc } from "./provider.js";
import { config } from "./config.js";

oidc.listen(config.port, () => {
  console.log(`OIDC provider running at ${config.issuer}`);
  console.log(`Discovery: ${config.issuer}/.well-known/openid-configuration`);
});
