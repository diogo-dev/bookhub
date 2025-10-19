# BookHub

## Pre-requisites

Install the following techs

- git
- npm
- node
- postgres driver

## Development Config

1. Clone Github repository
2. Install packages `npm i` for each directory `client/` and `server/`
3. On server, run migrations `npm run migrate:up`
    1. To revert migrations, run `npm run migrate:down`
4. Execute client and server on development `npm run dev`

## Project structure

The `server/` folder contains the following content:

- SQL migrations on `migrations/`
- Domain entities on `entities/`
- In-memory and persistent repositories on `repositories/`
- HTTP endpoints on `main.ts`

The `client/` folder contains the following content:

- Next.js `app/` folder with layout and pages
  - Each subfolder defines a route, ex. `/products/page.tsx` will be `http://locahost:3000/products`
