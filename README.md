# Node.js OIDC Identity Provider (practical exercise)

A local OpenID Connect provider built on [`node-oidc-provider`](https://github.com/panva/node-oidc-provider) (v9). It supports the Authorization Code flow with PKCE, signs tokens with RS256 using a locally generated key, and publishes discovery and JWKS endpoints.

It is a learning and demo build, not production software. The gaps are listed at the end.

Tested on Node 22.18.0.

## What is covered

| Requirement                                                    | Where / how                                     |
| -------------------------------------------------------------- | ----------------------------------------------- |
| Provider on `node-oidc-provider`, runs locally                 | `src/provider.js`, `src/server.js`              |
| One OIDC client with `openid` scope and `code` response type   | `src/config.js` (`clients`)                     |
| Full Authorization Code flow                                   | see "Login flow" below                          |
| Login and consent, in-memory test users                        | library dev screens, users in `data/users.json` |
| Signed ID Token (RS256) with `sub`, `iss`, `aud`, `iat`, `exp` | key from `scripts/generate-keys.js`             |
| JWKS endpoint, public keys only                                | `/jwks`                                         |
| Discovery                                                      | `/.well-known/openid-configuration`             |
| Verify in jwt.io                                               | see "Verify the ID token" below                 |

Optional extras: PKCE (required for every request), UserInfo endpoint, tamper test, signing key rotation, JWT access tokens through resource indicators, event logging.

## Quick start (fresh clone)

```bash
git clone https://github.com/Paramjeet-27/portainer_oidc.git
cd portainer_oidc
npm install
cp .env.example .env       # Windows PowerShell: Copy-Item .env.example .env
npm run generate-keys  # creates keys/jwks.json (private, gitignored)
npm run dev            # or: npm start
```

The `generate-keys` step is required. `keys/` is gitignored, so a fresh clone has no signing key and the server will not start without one. Running the script again replaces the key, which invalidates every token issued before.

Expected output:

```
OIDC provider running at http://localhost:3001
Discovery: http://localhost:3001/.well-known/openid-configuration
```

You will also see several `oidc-provider NOTICE` lines. They are expected, see "Known limitations".

## Credentials and endpoints

| Item                  | Value                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| Issuer                | `http://localhost:3001`                                               |
| Discovery             | `http://localhost:3001/.well-known/openid-configuration`              |
| JWKS                  | `http://localhost:3001/jwks`                                          |
| Authorization         | `http://localhost:3001/auth`                                          |
| Token                 | `http://localhost:3001/token`                                         |
| UserInfo              | `http://localhost:3001/me`                                            |
| Client ID / secret    | `CLIENT_ID` / `CLIENT_SECRET` from your `.env`                        |
| Client authentication | `client_secret_basic` (HTTP Basic at `/token`)                        |
| Redirect URIs         | `https://oidcdebugger.com/debug`, `https://my-test-redirect.com`      |
| Test users            | `deepak`, `harsh`, `raghav`, `rohan`, `vivek` (see `data/users.json`) |

Login uses the library's development screens. Enter a username from the list above. The password is not checked (see limitations).

## Login flow

Tools used: a browser (or [oidcdebugger.com](https://oidcdebugger.com)) for `/auth`, Postman (or `curl.exe`) for `/token` and `/me`, and [jwt.io](https://jwt.io) for verification.

PKCE is required, so every authorize request needs a `code_challenge`.

**1. Make a PKCE pair**

```bash
node -e "import('node:crypto').then(({randomBytes,createHash})=>{const v=randomBytes(32).toString('base64url');console.log('verifier:',v);console.log('challenge:',createHash('sha256').update(v).digest('base64url'))})"
```

Keep the verifier. You need it at `/token`.

**2. Authorize in the browser** (one line, replace `CLIENT_ID` and `CHALLENGE`)

```
http://localhost:3001/auth?client_id=CLIENT_ID&response_type=code&redirect_uri=https://my-test-redirect.com&scope=openid%20email%20profile&code_challenge=CHALLENGE&code_challenge_method=S256&state=abc
```

Log in as one of the test users and continue on the consent screen. The browser is redirected to `https://my-test-redirect.com/?code=...&state=abc`. The page itself does not need to load. Copy the `code` value from the address bar.

If the login screen is skipped, the provider is reusing the session cookie from an earlier login. Use a private window to switch users.

**3. Exchange the code at `/token`** (Postman)

- `POST http://localhost:3001/token`
- Authorization: Basic Auth with the client ID and secret
- Body, `x-www-form-urlencoded`:
  - `grant_type` = `authorization_code`
  - `code` = the code from step 2
  - `redirect_uri` = `https://my-test-redirect.com` (must match step 2 exactly)
  - `code_verifier` = the verifier from step 1

The same call with `curl.exe` (PowerShell):

```
curl.exe -u "CLIENT_ID:CLIENT_SECRET" -X POST http://localhost:3001/token --data-urlencode "grant_type=authorization_code" --data-urlencode "code=CODE" --data-urlencode "redirect_uri=https://my-test-redirect.com" --data-urlencode "code_verifier=VERIFIER"
```

A code is single-use and short-lived, and it lives in memory, so restarting the server invalidates it. Paste it without line breaks.

**4. UserInfo**

`GET http://localhost:3001/me` with `Authorization: Bearer <access_token>`. Without a resource indicator the access token is opaque and is accepted here.

## Verify the ID token

1. Open [jwt.io](https://jwt.io) and paste the `id_token`. The decoded header shows `alg: RS256` and a `kid`. The payload shows `sub`, `iss`, `aud`, `iat`, `exp`.
2. Fetch `http://localhost:3001/jwks` and pick the key whose `kid` matches the token header.
3. Give jwt.io that public JWK (or run `npm run jwk-to-pem` and paste the PEM). It should report a valid signature.

Decoding only reads the payload. It proves nothing. Verifying checks the signature against the provider's public key, and a consuming app must also check `iss`, `aud` and `exp`.

Never paste `keys/jwks.json` anywhere. It contains the private key. `/jwks` publishes the public part only.

## Extras

### Tamper test

```bash
npm run tamper-test -- <id_token>
```

Prints `original token valid: true` and `tampered token valid: false`. The script changes `sub` in the payload and re-checks the original signature. It verifies against the first key published at `/jwks`, so after a key rotation use a token signed by the current signing key.

### Signing key rotation

```bash
node scripts/rotate-keys.js list
node scripts/rotate-keys.js add
node scripts/rotate-keys.js promote <kid>
node scripts/rotate-keys.js retire <kid>
```

The first key in `keys/jwks.json` signs. All keys are published at `/jwks` (public part only). `add` publishes a key without signing with it, `promote` moves a key to the front, and `retire` removes it from `/jwks` (the signing key cannot be retired). Keys load at startup, so restart the server after each change. Retire an old key only after the tokens it signed have expired.

### JWT access tokens (resource indicators)

By default the access token is opaque and is meant for `/me`. To get a JWT access token for an API, the client names the API with the `resource` parameter.

The only API this provider accepts is `http://abc.com/some_api` (`apiResource` in `src/config.js`). It is an identifier, nothing runs at that address. The token gets `aud` set to that URL, `scope` set to `api:read`, and a one hour lifetime.

To try it:

1. At `/auth`, add `&resource=http://abc.com/some_api` and use `scope=openid api:read` (add `email profile` if you also want user claims in the ID token).
2. At `/token`, add `resource` = `http://abc.com/some_api` to the body.

Observed behavior with this configuration:

| `resource` at `/auth` | `resource` at `/token` | Result                                      |
| --------------------- | ---------------------- | ------------------------------------------- |
| no                    | no                     | opaque access token                         |
| no                    | yes                    | `invalid_target`                            |
| yes                   | no                     | opaque access token                         |
| yes                   | yes                    | JWT access token (`aud` is the API URL)     |
| unknown URL           | any                    | `invalid_target` at `/auth`, no code issued |

Only the scopes defined for the API (`api:read`) survive in the access token's `scope`. User claims come from the ID token or `/me`, not from the access token. The ID token and the access token are signed with the same key. Only `aud` tells them apart, so an API must check `aud`.

The check in `getResourceServerInfo` is what rejects unknown resources. The provider will issue a token for any URL if it is removed.

## Debugging notes

Events are logged to the console: authorization, code issued and consumed, grant success, and errors. Only event names, the client ID and error fields are logged, never codes, tokens, secrets, headers or request bodies.

The client only ever sees a generic error. The server log has the specific reason.

| Test                                      | Expected log                                                        |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `redirect_uri` not registered, at `/auth` | `[authorization.error] invalid_redirect_uri`                        |
| wrong `redirect_uri` at `/token`          | `[grant.error] invalid_grant`, detail: redirect_uri mismatch        |
| wrong client secret                       | `[grant.error] invalid_client`, detail: invalid secret provided     |
| wrong client ID                           | `[grant.error] invalid_client`, detail: client not found            |
| code reused or from before a restart      | `[grant.error] invalid_grant`, detail: authorization code not found |
| unknown `resource`                        | `[authorization.error] invalid_target`                              |

Common problems:

| Symptom                                     | Cause                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Crash on start, `ENOENT ... keys/jwks.json` | keys not generated, run `npm run generate-keys`                                           |
| `client_id is mandatory`                    | `.env` missing or empty                                                                   |
| `invalid_grant` at `/token`                 | code reused, expired, from before a restart, or `code_verifier` / `redirect_uri` mismatch |
| `invalid_client`                            | wrong client ID or secret                                                                 |
| Scripts cannot reach the server             | `PORT` differs between `.env` and the script's environment                                |

## Project structure

```
src/
  server.js        starts the server (loads .env first)
  provider.js      builds the Provider, resource indicators, event logging
  config.js        port, issuer, clients, claims, API resource
  accounts.js      findAccount, loads data/users.json
scripts/
  generate-keys.js  RSA key pair -> keys/jwks.json (thumbprint kid, RFC 7638)
  rotate-keys.js    add / promote / retire / list signing keys
  tamper-test.js    verifies an ID token before and after editing sub
  jwk-to-pem.js     prints the public key from /jwks as PEM
data/users.json    test users
docs/NOTES.md      design notes and answers
```

## Known limitations

This is a demo build. Before production I would change:

- **Storage.** The default in-memory adapter loses codes, sessions and opaque tokens on restart. Use a persistent adapter such as Redis, which also allows rolling restarts.
- **Login.** The development interactions screen does not check a password. A real login and consent UI is needed.
- **Keys.** The signing key is a file on disk. Production would load it from a secrets manager or KMS, and rotate it on a schedule.
- **Lifetimes.** Session, grant and token lifetimes use library defaults (hence the startup NOTICE lines) and should be set explicitly.
- **Clients and users** are static files, so changes need a restart. Clients would come from storage, and each client's allowed resources should be registered and checked, not one hardcoded API.
- **Transport.** Plain HTTP on localhost. Production needs HTTPS.
- **Secrets.** The client secret lives in `.env`. Production would use a secrets manager and hashed storage.
- **Grant types.** Only the authorization code grant is enabled. No refresh tokens or client credentials.
- **Hardening.** No rate limiting, no custom error page.
