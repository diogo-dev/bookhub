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

## Understanding the System
Imagine you are a regular user looking for a book to read from our library. As soon as you access the website, you can use the search bar to look for books.

<table align="center">
  <td align="center">
    <img src="/client/public/images/home.png" alt="Home Page" width="800" />
  </td>
</table>

Alternatively, you can scroll down and browse through the books already organized by category.

<table align="center">
  <td align="center">
    <img src="/client/public/images/highlights.png" alt="Home Page" width="800" />
  </td>
</table>

<table align="center">
  <td align="center">
    <img src="/client/public/images/fiction.png" alt="Home Page" width="800" />
  </td>
</table>

You also can select the "Ver todos (see all)" options and apply filters to the books of that category

<table align="center">
  <td align="center">
    <img src="/client/public/images/fictionFilters.png" alt="Home Page" width="800" />
  </td>
</table>

Now, imagine you have chosen the book **“It Ends With Us”** and want to make a reservation. To do so, simply click on the book and you will be redirected to a page displaying the details and specifications of the selected title.

<table align="center">
  <td align="center">
    <img src="/client/public/images/reserveBook.png" alt="Home Page" width="800" />
  </td>
</table>

Next, click the **“Reservar (Reserve)”** button, choose the reservation date, and confirm the action. That’s it! The library now knows you enjoy romance books and is waiting for you 😊

<table align="center">
  <tr>
    <td align="left">
      <img src="/client/public/images/createReserve.png" alt="Home Page" width="800" />
    </td>
    <td align="right">
      <img src="/client/public/images/reserved.png" alt="Home Page" width="800" />
    </td>
  </tr>
</table>

> **Note:** If you are not logged in, it will not be possible to make a reservation.

Once you arrive at the library (within the selected time period), you go to the service desk to complete the loan process.

The librarian will ask for your CPF (similar to SSN in US) and check that there is a reserved book under your name. After that, the book loan will be released to you. Simple as that!

The following steps describe the process the librarian must perform:
1) Click on the menu icon on the top left to see the menu actions. Select "Empréstimo de Livros" (Book Loan) option.

<table align="center">
  <td align="center">
    <img src="/client/public/images/adminActions.png" alt="Home Page" width="800" />
  </td>
</table>

2) Select "Empréstimo Reservado" (Reserved Loan) card

<table align="center">
  <td align="center">
    <img src="/client/public/images/reservedLoan1.png" alt="Home Page" width="800" />
  </td>
</table>

3) Once the librarian enters the user's CPF (SSN) number, the reservations is displayed. Now, by clicking on the reservation card, the loan button ("Efetuar Empréstimo") will be enabled.

<table align="center">
  <td align="center">
    <img src="/client/public/images/reservedLoan2.png" alt="Home Page" width="800" />
  </td>
</table>

4) Once the loan button is selected, choose the loan due date and confirm the action.

<table align="center">
  <tr>
    <td align="left">
      <img src="/client/public/images/loanBook.png" alt="Home Page" width="800" />
    </td>
    <td align="right">
      <img src="/client/public/images/confirmLoan.png" alt="Home Page" width="800" />
    </td>
  </tr>
</table>

At the end of the process, the librarian also accessed the book return section and verified that one of the books you had borrowed was past its due date. After you paid a fine and returned the book, the librarian released the book “It Ends With Us” for you to enjoy.

<table align="center">
  <td align="center">
    <img src="/client/public/images/returnBook1.png" alt="Home Page" width="800" />
  </td>
</table>

<table align="center">
  <tr>
    <td align="left">
      <img src="/client/public/images/returnBook2.png" alt="Home Page" width="800" />
    </td>
    <td align="right">
      <img src="/client/public/images/confirmReturn.png" alt="Home Page" width="800" />
    </td>
  </tr>
</table>

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
- HTTP endpoints on `index.ts`

The `client/` folder contains the following content:

- Next.js `app/` folder with layout and pages
  - Each subfolder defines a route, ex. `/products/page.tsx` will be `http://locahost:3000/products`

## Technologies

Server:
  - Node.js + Express
  - JWT for RBAC (Role-Based Access Control)
  - Umzug for database migrations
  - Zod for schema and data validation
  - Books extracted from Open Library API

Client:
  - React + Next.js + CSS modules
  - Fetch API for REST API communication
  - Sonner for toast notification
