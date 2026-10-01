Delaying in using authorization code - "code" - gave grant error :
{"error":"invalid_grant","error_description":"grant request is invalid"}

in dev mode, password is not checked

> tried putting it faster, it gave the proper tokens.

conformIdTokenClaims: false :: Flag using which we can contrl whether to include the claims in id_token. default is true.

on putting wrong client id: i get : error: invalid_client
error_description: client is invalid
state: 688758gm0y9
iss: http://localhost:3001
