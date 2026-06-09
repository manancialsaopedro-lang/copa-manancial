# copa-manancial

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3f584ccb-a9a0-419a-b4cb-bae1fbdbf520

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Neon pooled connection string.
3. Apply database migrations:
   `npm run db:migrate`
4. Run the app:
   `npm run dev`

## Neon database automation

This app stores orders, event configuration, and ingredients in Neon/Postgres when `DATABASE_URL` is set.

Use this value in `.env`:

```sh
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require"
```

Where to get it in Neon:

1. Open the Neon dashboard.
2. Select the project for this app.
3. Go to `Connection Details`.
4. Choose the `Pooled connection` endpoint.
5. Copy the Postgres connection string and paste it as `DATABASE_URL`.

You do not need an anon key for this app. Neon uses the Postgres connection string. A Neon API key is only needed for Neon CLI/MCP project management, not for the app to save data.

Migrations live in `migrations/`. Run them manually with:

```sh
npm run db:migrate
```

After `npm install`, the project configures `.githooks/post-merge`. That hook runs `npm run db:migrate` automatically after `git pull`.
