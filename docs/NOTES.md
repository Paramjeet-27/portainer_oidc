Delaying in using authorization code - "code" - gave grant error :
{"error":"invalid_grant","error_description":"grant request is invalid"}

> tried putting it faster, it gave the proper tokens.

KID is basically "Key ID" > of the signing key. Just to identify.

in dev mode, password is not checked

conformIdTokenClaims: false :: Flag using which we can contrl whether to include the claims in id_token. default is true.

on putting wrong client id: i get : error: invalid_client
error_description: client is invalid
state: 688758gm0y9
iss: http://localhost:3001

Routes are defined in :
node_modules\oidc-provider\lib\helpers\defaults.js > in makeDefaults()...., there we can change its values.

pkce: {
required: () => true,
},

> This is needed if PKCE is required, else, flow can work just without the PKCE, also this is a function, not just a simple boolean value, because we have have differnt flows for differnt type of clients, and we can manage it here. Like for some clients we have to keep it enabled, but others can just work without PKCE

using "defaultResource" fills in the "resource" parameter in /auth. If its present, client does not need to send the "..&resouce=url" while calling /auth. But if its not present, passing the resource in auth is mandatory. Not passsing in auth and passing it in /token gives grant error. Not providing it in anything gives simple opaque token, but api:read will not be present in scope here.

in this build only access token and id token is issues, refresh token is not issues becuase only authorization grant is enabled

if we get access token without openid in the scope, then on using userinfo we get :
[userinfo.error] insufficient_scope: access token missing openid scope
{
"error": "insufficient_scope",
"error_description": "access token missing openid scope",
"scope": "openid"
}

modyfying the ttl just needs :
ttl: {
AccessToken: 600,
AuthorizationCode: 60,
},
etc values, in seconds. Keys can be cheked from default.js

To get and use refresh_token:
while calling /auth scope needs to have "offline_access" and url needs to have: ..."prompt=consent".

grant_types needs to have "refresh_token" included

if we need to rotate the refresh token we can just add: rotateRefreshToken: true,
