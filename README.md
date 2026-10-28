# SevenHost site

Pre-launch website for SevenHost. Static files in `public/`, published by Cloudflare (Workers static assets).

## Edit before publishing
- `public/config.js`: set `contactEmail` (and optionally `whatsapp`). Plans and prices there are placeholders, not live offers.

## Deploy
Connect this repo in Cloudflare (Workers & Pages), Worker name `sevenhost`, empty build command, deploy command `npx wrangler deploy`.

## Rules baked into this project
- No secrets, API keys or passwords in any file under `public/`: every visitor can download them.
- No "unlimited" claims. No payments are taken: do not add a checkout until hosting is really provisioned.
- Free Cloudflare accounts must not be used to resell hosting to customers. Customers use their own accounts.

## Optional Stage 3
`stage3/` holds a Worker and D1 schema for storing waitlist and contact messages. It is not deployed until you follow the guide.
