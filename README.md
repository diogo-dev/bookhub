# BookHub

**BookHub** is a library management system where regular users (readers) can:
- Search for books  
- Reserve books  
- Add and remove books from their wishlist  

Library staff members (system administrators) are responsible for managing:
- Book loans and returns for reserved books  
- Book loans and returns for non-reserved books  
- Book management (create, remove, and edit books)  
- User and staff profile management  

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
    2. To create migrations, run `npm run migrate:create filename.ts`
    3. And to populate database, run `npm run populate`
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
