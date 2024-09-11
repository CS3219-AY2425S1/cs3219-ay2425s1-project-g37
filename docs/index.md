# Developer Documentation

This file contains the information needed to maintain this repository.

Please read through the entire document at least once, since its organisation is pretty messy (sorry).

## Installation

### Install necessary softwares

- [Node.js](https://nodejs.org) v20+
- [Bun](https://bun.sh) v1.1+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Set up database

We use MongoDB as the database of choice.

#### Use a local database (recommended)

Simply run `docker-compose up`. It will install the MongoDB Community Server and set up a MongoDB database running on port 27017. When you finish the development session, run `docker-compose down` to end the service. The database data is persisted between sessions.

If you choose this option, the **connection string** of the database is `mongodb://localhost:27017/peerprep`. This string will be important when setting up environment variables.

**Inspection:** If you want to view the content of the database visually, you can install any MongoDB inspection softwares, such as [MongoDB Compass](https://www.mongodb.com/products/tools/compass), the [official MongoDB VSCode extension](https://marketplace.visualstudio.com/items?itemName=mongodb.mongodb-vscode), etc.

#### Use MongoDB Atlas

You can also choose to use MongoDB Atlas. In that case, simply open an account there, create a database and follow the instructions to get the database connection string.

### Install dependencies

Simply run `bun i` in the project directory.

### Set up environment variables

Create a file named `.env` at the root of the project directory. Copy the content of `.env.example` to `.env`. Add the missing environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.).

See the environment variable descriptions below for details.

| Name                         | Type     | Required | Description                                                                                                                             |
| ---------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `PEERPREP_FRONTEND_PORT`     | `number` | ⚠️ Yes   | The port at which the PeerPrep frontend is run. Suggested value is `3000`, though you can select any free port.                         |
| `PEERPREP_QUESTION_SPA_PORT` | `number` | ⚠️ Yes   | The port at which the question SPA frontend is run. Suggested value is `3001`, though you can select any free port.                     |
| `USER_SERVICE_PORT`          | `number` | ⚠️ Yes   | The port at which the user service is run. Suggested value is `3002`, though you can select any free port.                              |
| `QUESTION_SERVICE_PORT`      | `number` | ⚠️ Yes   | The port at which the question service is run. Suggested value is `3003`, though you can select any free port.                          |
| `DATABASE_URL`               | `string` | ⚠️ Yes   | The database connection string above. You might need to add quotation marks, e.g. `DATABASE_URL="mongodb://localhost:27017/peerprep"`   |
| `JWT_SECRET`                 | `string` | ⚠️ Yes   | A random string used as the secret to sign and verify JSON Web Tokens. You can go to https://generate-secret.vercel.app/32 to grab one. |

## Repository structure overview

We use [Turborepo](https://turbo.build/repo) to combine all microservices under one single repository. You need not know how Turborepo works.

The repository is set up as follows:

- `apps`: The frontends of the project (PeerPrep frontend, question service SPA).
- `services`: The microservices of the project.
- `packages`: Shared code that more than one frontend/microservice uses.

### Shared packages

- `db`: This one hosts the database [Prisma](https://prisma.io) schema at `prisma/schema.prisma`. You need to learn Prisma, though it is pretty straightforward.
- `env`: This one allows us to access environment variables with full type-safety and runtime validation.
- `schemas`: This one contains the typing and validation schema for various data types we use in the application (the user object, the question object, etc.).
- `utils`: This one contains various utility functions and plugins in use in more than one microservice.

More documentation on each of these packages is provided below.

## How to run the project

### In development mode

> [!NOTE]
> This step might probably change after we containerise the app.

`bun dev` or `bun run dev` from the root of the repository will run all apps and microservices in dev mode. For the Vite apps, in dev mode, changes in the code will be instantly reflected in the browser in real time. For microservices, a refresh is needed.

If you want to run only one particular microservice or app in dev mode, simply `cd` to that app and run `bun dev`.

```
cd apps/peerprep
bun dev
```

### Building for production

> [!NOTE]
> This step might probably change after we containerise the app.

The dev mode above is not optimised. To build the app for use in production mode (for demo purpose, for deployment, etc.), run `bun run build` from the root of the repository.

### In production mode

> [!NOTE]
> This step might probably change after we containerise the app.

We can serve all apps and microservices in production mode using `bun start`, also from the root of the repository. You need to run build before running this.

### Ports

The port used by each project is declared in the environment variable file.

## User service documentation

It is more or less the same as the provided user service.

| Method   | Route                   | Description                                                                     |
| -------- | ----------------------- | ------------------------------------------------------------------------------- |
| `POST`   | `/users`                | Create user                                                                     |
| `GET`    | `/users`                | Get all users (requires admin account)                                          |
| `GET`    | `/users/:id`            | Get user `id` (requires either admin account or authentication as user `id`)    |
| `PATCH`  | `/users/:id`            | Update user `id` (requires either admin account or authentication as user `id`) |
| `PATCH`  | `/users/:id/privileges` | Update user `id`'s admin status (requires admin account)                        |
| `DELETE` | `/users/:id`            | Delete user `id` (requires either admin account or authentication as user `id`) |
| `POST`   | `/auth/login`           | Log in with a given email and password                                          |
| `GET`    | `/auth/verify-token`    | Get the current authenticated user's data (similar to `/users/:id`)             |

We need not worry about the type of the requests and responses, because we will use [Eden](https://elysiajs.com/eden/overview) to simplify this process.

### How authentication works

When you log in via `/auth/login`, the response will set a JWT token as a cookie in the user browser. Subsequent requests from the browser automatically carries that token, so there is no need to explicitly attach a bearer token in the `Authorization` header.

The token is shared across all `localhost` ports, so even though the user service is at localhost:x, requests to localhost:y still carry the token automatically. Note that if we are going to host the app on the internet, this step will need some additional handling.

The token expires after 1 month. There are currently no token rotation mechanism (i.e. you have to log in again after one month, regardless of how active or inactive you are) and no CSRF mitigation measures (which are not necessary[^1]).

[^1] We handle actions via JSON-based requests, not `<form>` `POST` actions, so CSRF attacks are not applicable.

In Elysia, we can check for the auth token using the auth plugin from `@peerprep/utils`.

```tsx
new Elysia().use(elysiaAuthPlugin).get("/", ({ user }) => {
  console.log(user); // <- User if authenticated, null otherwise
});
```

## Question service documentation

| Method   | Route  | Description                                   |
| -------- | ------ | --------------------------------------------- |
| `POST`   | `/`    | Create new questions (requires admin account) |
| `GET`    | `/`    | Get all questions                             |
| `GET`    | `/:id` | Get question `id`                             |
| `PATCH`  | `/:id` | Update question `id` (requires admin account) |
| `DELETE` | `/:id` | Delete question `id` (requires admin account) |

## `@peerprep/db`

Please take some time to familiarise yourself with [Prisma](https://prisma.io).

### Access database data

To access the database, simply use the `db` variable:

```tsx
import { db } from "@peerprep/db";

const users = await db.user.findMany();
```

### Update database schema

If the update is not a breaking change and doesn't affect existing data (e.g., the addition of a new database collection): Simply edit the schema file, then run `bun db:push` to send the update to the database.

If the update is a breaking change: Are you sure you want to do it?

## `@peerprep/env`

### Read environment variables

To access the environment variable, simply use the exported `env` instead of using `process.env` directly.

```tsx
import { env } from "@peerprep/env";

// TypeScript error here because this is a typo
console.log(`The JWT secret is ${env.JWT_SECRTE}`);

// It works here
console.log(`The JWT secret is ${env.JWT_SECRET}`);
```

### Add new environment variables

- Add it to `packages/env/src/index.ts`. Refer to [T3 Env documentation](https://env.t3.gg/docs/core) for more information.
- Document it in section "Set up environment variables" above.
- Add it to `.env.example`. If it is a sensitive value, remove the value there, only keep the environment variable name.

## `@peerprep/schemas`

We use the `t` utility imported from Elysia for validation, because we want to use these schema objects for [validation inside Elysia](https://elysiajs.com/validation/overview.html).

Refer to existing usage of `@peerprep/schemas` for more information.

## `@peerprep/utils`

### `ExpectedError` and `elysiaHandleErrorPlugin`

First we need to know that there are two different types of errors.

The first type is unexpected errors. They are errors thrown when everything should have run fine, i.e. these are bugs in your code. For example, the user puts in the correct information, but user registration still fails. In this scenario, we will simply tell the user that "Something went wrong, sorry". These errors are 5xx errors ("developer messed up" errors).

The second type is expected errors. These occur when users make a mistake. For example: email already used by someone else, performing actions without logging in. In this scenario, it's not a code bug and we will give the user a friendly error message telling them what went wrong. These errors are 4xx errors ("user messed up" errors).

`ExpectedError` and `elysiaHandleErrorPlugin` are written to handle user errors. Whenever such an error occurs, we provide `ExpectedError` with a user-friendly message and a status code, after which `elysiaHandleErrorPlugin` will handle it and return the correct message and status code to the user. Please use `http-status-codes` to make the code more readable.

```tsx
import { ExpectedError } from "@peerprep/utils";
import { StatusCodes } from "http-status-codes";

if (!email.includes("nus.edu")) {
  throw new ExpectedError(
    "This application is not available for people outside NUS",
    StatusCodes.FORBIDDEN,
  );
}
```

### `elysiaAuthPlugin`

This plugin verifies the JWT token and adds to the context the current user.

```tsx
new Elysia().use(elysiaAuthPlugin).get("/", ({ user }) => {
  console.log(user); // <- User if authenticated, null otherwise
});
```

We can use this to guard endpoints against unauthenticated requests, for example

```tsx
new Elysia()
  .use(elysiaAuthPlugin)
  .onBeforeHandle(({ user, set }) => {
    if (!user?.isAdmin) {
      set.status = StatusCodes.FORBIDDEN;
      return { message: "Forbidden" };
    }
  })
  // The user is guaranteed to be an admin now
  .get("/", () => getAllUsers());
```

## Style guide

Please set up ESLint and Prettier in your code editor. If you are using VSCode, install these extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

If you are not using VSCode, please follow the steps for your editor that you can find online. If possible, please enable formatting files on save, so that whenever you save a file, your editor will format it for you using Prettier.

### Manual formatting

You can run `bun format` from the project root directory to manually format all files in the project. Recommended to run this regularly if your editor's Prettier set up is glitchy.

### Linting

Run `bun lint` from the project root directory to run ESLint on all files. Ideally we would want this to pass, so if you have time please fix the errors/warnings reported by ESLint.

### File name convention

Please, please, PLEASE use `kebab-case` for file and folder names. **NO CAPITAL LETTERS IN FILE NAMES PLEASE.**

Ignore all those people saying React component files must be named like so: `FileName`. React doesn't require the files to be named as such, in fact React doesn't care about how you name your files.

The reason we want to avoid capital letters at all cost is because, in Windows and macOS, the file system is case insensitive (`SOMEFILE.txt` is the same as `somefile.txt`), while in Linux, the file system is case sensitive (`SOMEFILE.txt` is not the same as `somefile.txt` and if you try to read `somefile.txt` while having `SOMEFILE.txt` you will get an error). If we use capital letters, we could get to a scenario where the thing builds just fine on your laptop, but blows up on Docker or your cloud hosting platform.

Not to mention changing file names that differ only in casing is a pain. I've been through that, I don't want us to go through that again.

So: instead of `UserHistory.tsx` for the `<UserHistory />` component, please name it `user-history.tsx`.

## Miscellaneous

### Install a utility package as the dependency of a service

Say you want to use `@peerprep/utils` inside `@peerprep/user-service`, then you simply need to add

```json
{
  "dependencies": {
    // ...
    "@peerprep/utils": "workspace:*"
  }
}
```

and rerun `bun i`. Then you will be able to import and use `@peerprep/utils` inside the user service code.

### Create a new app/package/service

Simply copy an existing app/package/service and modify it. I would advise against using scaffolding commands like `bun create vite`, because that one only has the most basic configurations and we need a few more configurations here.

Please remember to update the `name` field in `package.json`. Each app, package and service must have a distinct `name`. Name the new entity using the format `@peerprep/...` to avoid clashing with NPM package names.

If in doubt just ask me (@joulev) I will do this for you.

### Make an app/package/service have access to environment variables

The app/package/service **must** have its own `.env` (e.g., `services/questions-service/.env`) to be able to read environment variables. But we don't want to maintain a million different `.env` files at the same time, that's why all of these "child" `.env` files are made to be symlinks to the root `.env` file, so that changes to the root `.env` file is reflected in all "child" `.env` files.

To create a new symlink child `.env`, run this command

```sh
# macOS/Linux only
cd services/questions-service # this step is important
ln -s ../../.env .env
```

These child `.env` files should be added to version control. Don't worry, the secrets are safe inside the root `.env` and are not uploaded to GitHub.

If you are running Windows, please either migrate to Windows Subsystem for Linux or ping me.