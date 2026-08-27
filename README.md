This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:


You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Platewise Food & Snacks

Company food ordering and collection system built with Next.js App Router, TypeScript, Prisma, SQLite for local development, Zod, bcryptjs, and signed HTTP-only cookie sessions.

## Architecture

- `src/app`: server-rendered pages and protected route handlers
- `src/lib/auth.ts`: session creation, current-user lookup, and role helpers
- `src/lib/booking.ts`: server-time booking state calculation
- `prisma/schema.prisma`: normalized relational model for users, shifts, services, menus, orders, inventory, collection, overrides, and audit logs
- `prisma/seed.ts`: development accounts only; intentionally creates zero shifts

The database is designed so employee ordering is constrained by the employee's assigned shift and service. Inventory decrements use a transaction plus a conditional `availableQty >= requested` update, preventing concurrent over-ordering. Collection confirmation uses the same conditional update pattern to prevent duplicate collection.

## Local setup

```bash
npm install
npm run setup
npm run dev
```

`npm run setup` generates Prisma, creates the local SQLite database, and adds the four development accounts. The `npm run dev` and `npm run build` commands automatically run Prisma generation first. After the first setup, use only `npm run dev` for development. For the fastest response time, build once and use the production server:

```bash
npm run build
npm start
```

The production server avoids the development compiler. Prisma, TypeScript, ESLint, and Tailwind packages are build-time tools and are not sent to browser users; they must remain installed for database generation and builds. Use `npm run dev:clean` only when the Next.js cache needs to be rebuilt.

Open `http://localhost:3000/login`. The login page redirects by role:

- Employee ordering: `/`
- Admin workspace: `/Admin` (Windows may display this as `/admin`)
- Management workspace: `/mgmt`
- Food collection desk: `/delivery`

The employee development account uses `ChangeMe123!`:

| Employee ID | Role |
| --- | --- |
| `EMP001` | Employee |

Privileged workspaces use endpoint passwords instead of database users:

| Endpoint | Password |
| --- | --- |
| `/Admin` | `AdminPass123!` |
| `/mgmt` | `MgmtPass123!` |
| `/collection` | `CollectionPass123!` |

No shift is seeded by design. Open `/Admin` and enter the Admin page password to create the first shift. The maximum of six active shifts is enforced by the server.

The Admin workspace at `/Admin` can create, edit, and delete shifts, and create, edit, deactivate, assign roles, assign shifts, and reset passwords for employee and staff accounts. Passwords are hashed with bcrypt and are never stored in plain text.

## Production notes

Set a long random `AUTH_SECRET`, use a managed PostgreSQL datasource for deployment, run migrations through the deployment pipeline, configure the company timezone, and replace the development passwords before allowing real access.

Vercel must have `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PAGE_PASSWORD`, `MANAGEMENT_PAGE_PASSWORD`, and `COLLECTION_PAGE_PASSWORD` configured under Project Settings > Environment Variables. The local SQLite database is for development only and is not persistent on Vercel.
