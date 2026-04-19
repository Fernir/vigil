# Vigil

Self-hosted status page: HTTP checks, live updates, charts, webhooks, SSL and performance metrics, and optional full-page screenshots. You keep the data on your own server.

## What you get

- **Real-time updates** through Server-Sent Events (no polling for the UI)
- **Charts** for response time history
- **Light and dark** themes, including system preference
- **Webhooks** when a service goes down, recovers, or when an SSL certificate is close to expiry
- **Public status** view and a **signed-in** dashboard to manage sites
- **SSL** monitoring and **Playwright**-based **screenshots** and page metrics
- **Text checks** (optional) to assert that the body contains (or does not contain) a string
- **Heuristics** (e.g. response-time spikes) to surface unusual behavior

## Requirements

- **Node.js** 24.x (see `package.json` `engines`)
- **Yarn** (or use npm / pnpm with equivalent commands)

## Quick start

```bash
git clone https://github.com/Fernir/vigil.git
cd vigil
yarn
yarn db:init
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Add a `.env` file in the project root, for example:

```env
DATABASE_URL="file:./db/data.sqlite3"
JWT_SECRET=your-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
```

`yarn db:init` runs migrations and seeds an admin user from `ADMIN_*` when the database is empty. Adjust `JWT_SECRET` for any non-local deployment.

## Webhook payload

If you set a webhook URL in settings, the app can POST JSON when something changes. Example shape:

```json
{
  "event": "down",
  "site": {
    "id": 1,
    "name": "My Site",
    "url": "https://example.com"
  },
  "status": "down",
  "responseTime": 1234,
  "statusCode": 500,
  "error": "connect ECONNREFUSED",
  "timestamp": "2025-03-18T12:34:56.000Z"
}
```

## Database

| Command        | Purpose                                      |
| -------------- | -------------------------------------------- |
| `yarn db:reset`  | Reset DB (destructive) and re-run seed path  |
| `yarn db:studio` | Open Prisma Studio (visual data browser)     |

## Tech stack

| Area        | Choice |
| ----------- | ------ |
| App         | [Nuxt 3](https://nuxt.com/), [Vue 3](https://vuejs.org/) |
| Styling     | [Tailwind CSS](https://tailwindcss.com/) via [@nuxtjs/tailwindcss](https://tailwindcss.nuxtjs.org/) |
| Components  | [shadcn-nuxt](https://www.shadcn-vue.com/docs/installation/nuxt), [Reka UI](https://reka-ui.com/) |
| Charts      | [Chart.js](https://www.chartjs.org/), [vue-chartjs](https://vue-chartjs.org/) |
| Data        | [Prisma](https://www.prisma.io/), [SQLite](https://www.sqlite.org/) |
| Auth        | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), httpOnly cookie |
| Browser CI  | [Playwright](https://playwright.dev/) |
| Validation  | [Zod](https://zod.dev/) |
| Images      | [@nuxt/image](https://image.nuxt.com/) (e.g. static assets in `public/`) |

## Contributing

Pull requests and issues are welcome.

## License

MIT. See `package.json` for the author line and full `license` field.
