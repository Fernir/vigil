# Vigil

<div align="center">
  <h3>Beautiful, real-time status page for your services</h3>
  <p>
    <strong>Real-time updates</strong> •
    <strong>Beautiful charts</strong> •
    <strong>Dark mode</strong> •
    <strong>Webhook notifications</strong>
  </p>
</div>

## Features

- **Real-time monitoring** via Server-Sent Events
- **Interactive charts** with response time history
- **Dark/light mode** with system preference detection
- **Webhooks notifications** when services go down
- **Public status page** for transparency
- **Admin dashboard** for managing services
- **Self-hosted** - you own your data
- **SSL certificate monitoring** with expiration alerts
- **Performance tracking** with load time, TTFB, and page size metrics
- **Screenshot capture** for visual verification
- **Custom text checks** to verify page content
- **Optimization advisor** with actionable recommendations

## Quick Start

```bash
# Clone repository
git clone https://github.com/Fernir/vigil.git
cd vigil

# Install dependencies
yarn

# Setup database
yarn db:init

# Start development server
yarn dev
```

## Environment Variables

Modify a .env file in the root (see .env.example):

```
DATABASE_URL="file:./db/data.sqlite3"
JWT_SECRET=your-super-secret-key
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=111111
```

Open http://localhost:3000

## Webhook notifications

You can receive alerts when a site goes down or recovers. Just set a webhook URL in your settings.

**Example payload:**

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
  "timestamp": "2025-03-18T12:34:56Z"
}
```

## Optimization Advisor

Vigil analyzes your site metrics and provides actionable recommendations:

- **Performance tips** when load times exceed thresholds
- **SSL alerts** before certificates expire
- **Availability insights** for uptime issues
- **Security suggestions** for HTTPS and configuration

## Database Management

```bash
# Reset database (clears all data)
yarn db:reset

# Open Prisma Studio (visual database editor)
yarn prisma:studio
```

## Built with

- [Nuxt 3](https://nuxt.com/) – Vue framework with SSR
- [Nuxt UI](https://ui.nuxt.com/) – beautiful components
- [Tailwind CSS](https://tailwindcss.com/) – styling
- [Chart.js](https://www.chartjs.org/) – interactive charts
- [Prisma](https://www.prisma.io/) – type-safe ORM
- [SQLite](https://www.sqlite.org/) – database
- [JSON Web Tokens](https://jwt.io/) – authentication via httpOnly cookies
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) – real‑time updates
- [Puppeteer](https://pptr.dev/) – screenshot capture and performance metrics

## Contributing

We welcome contributions!

## License

MIT © Fernir
