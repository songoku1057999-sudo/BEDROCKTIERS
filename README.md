# BedrockTiers

A responsive, fake-data Minecraft Bedrock PvP tier leaderboard. Frontend: GitHub Pages. API + persistent shared player data: Cloudflare Workers + KV. No Supabase or Firebase.

## Project structure

```text
BedrockTiers/
├── index.html
├── styles.css
├── app.js
├── config.js
├── README.md
└── worker/
    ├── index.js
    └── wrangler.toml
```

## 1. Create the Cloudflare KV database

1. Sign in at https://dash.cloudflare.com/
2. Open **Workers & Pages** → **KV**.
3. Create a namespace named `BEDROCKTIERS`.
4. Copy its Namespace ID.

## 2. Deploy the Worker

1. Open **Workers & Pages** → **Create** → **Worker** and create `bedrocktiers-api`.
2. Open the Worker editor and replace its code with the complete contents of `worker/index.js`, then deploy once.
3. In the Worker settings, add a KV binding:
   - Variable name: `BEDROCK_KV`
   - KV namespace: `BEDROCKTIERS`
4. In **Settings → Variables and Secrets**, add an Environment Variable / Secret:
   - Name: `ADMIN_SECRET`
   - Value: `1057999`
   Mark it as a Secret if the dashboard offers that option.
5. Save and redeploy.
6. Your API URL will look like `https://bedrocktiers-api.YOUR-SUBDOMAIN.workers.dev`.

**Important:** Do not put `1057999` in `app.js`, `config.js`, or any GitHub file. Only store it as the Worker secret.

### Alternative deployment with Wrangler

Install Wrangler on a computer with Node.js, then:

```bash
cd worker
npx wrangler kv namespace create BEDROCK_KV
```

Paste the returned namespace ID into `worker/wrangler.toml`, then:

```bash
npx wrangler secret put ADMIN_SECRET
# Enter: 1057999
npx wrangler deploy
```

The KV binding in `wrangler.toml` must be configured with the real namespace ID before deploying.

## 3. Connect the GitHub Pages frontend

1. Create a public GitHub repository named `BedrockTiers`.
2. Upload `index.html`, `styles.css`, `app.js`, and `config.js` to the repository root. You do not need to upload the `worker` folder for GitHub Pages.
3. Edit `config.js` and replace the placeholder with your real Worker URL:

```js
window.BEDROCKTIERS_API = "https://bedrocktiers-api.YOUR-SUBDOMAIN.workers.dev";
```

4. In GitHub, open **Settings → Pages**.
5. Under Build and deployment choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
6. Wait for GitHub Pages to publish the site.

## 4. First launch

Open the GitHub Pages URL. The first request to `GET /api/players` creates 30 fake players in KV. Later visits reuse the stored player list. The initial usernames are generated uniquely within that seed batch.

Open **Admin** in the sidebar and enter the passcode `1057999`. You can add, edit, delete, and randomly generate players. Changes are sent to the Worker and saved in KV, so they are shared across devices. The global order is recalculated from points automatically; edit a player’s points to move them up or down the leaderboard.

## API routes

| Method | Route | Access |
|---|---|---|
| GET | `/api/health` | Public |
| GET | `/api/players` | Public |
| POST | `/api/admin/login` | Passcode required |
| POST | `/api/admin/players` | Admin token |
| PUT | `/api/admin/players/:id` | Admin token |
| DELETE | `/api/admin/players/:id` | Admin token |

## Notes and limitations

- This is a fake community leaderboard, not a real tier-testing or Minecraft account verification system.
- Player heads and body renders use `mc-heads.net` with a rotating set of known Minecraft skin usernames; an internet connection is needed for those remote images. Admins can enter a different Minecraft username in the skin field. The rest of the interface and API are independent of that image service.
- KV is globally distributed and eventually consistent. It is suitable for this demonstration, but it does not provide database transactions or strict simultaneous-write locking. If two administrators edit at exactly the same time, a last-write-wins conflict is possible.
- Cloudflare and GitHub free-plan limits and terms can change. Check their current dashboards before relying on a free quota.
- The admin token is stored in `sessionStorage` and expires after four hours. The passcode itself is never sent to or stored in the GitHub Pages code.
- Set up CORS to your exact GitHub Pages domain before using this publicly if you want to restrict browser origins. This starter Worker currently returns `Access-Control-Allow-Origin: *`; authorization still protects all write endpoints.
