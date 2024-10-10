# Developer Documentation

This file contains the information needed to maintain this repository.

Please read through the entire document at least once, since its organisation is pretty messy (sorry). Also do get yourself used to the main source code as well.

## Installation

### Install necessary softwares

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Set up environment variables

Create a file named `.env` at the root of the project directory. Copy the content of `.env.example` to `.env`. Add the missing environment variables (`JWT_SECRET`, `ADMIN_SIGNUP_TOKEN`) according to the instructions in the guide.

Yes, that's it. This is all what is required to run the app in production mode. For development mode, a few more steps are required, see below.

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
- `ui`: This one contains the shared UI components used in both frontends.
- `utils`: This one contains various utility functions and plugins in use in more than one microservice.

More documentation on each of these packages is provided below.

## How to run the project

Ensure you have stable Internet connection via Wi-Fi. Using mobile data is not recommended since it is possible you will be downloading gigabytes of data (for Docker).

### Build the base OS image

```
docker build -t peerprep-base -f docker/base.Dockerfile .
```

This step you only need to do once.

### In production mode

1. Build the Docker images:

   ```
   docker-compose build
   ```

1. Bring the services up:

   ```
   docker-compose up
   ```

1. Wait a few seconds for the images to be fully up, then you can access the frontends at http://localhost:3000 (main frontend) and http://localhost:3001 (admin portal).

1. To shut down, simply Ctrl+C then `docker-compose down`.

### In development mode

1. We also need [Node.js](https://nodejs.org) (v20+) and [Bun](https://bun.sh) (v1.1+), so install them.[^1]

[^1]: Node.js and Bun are actually not strict requirements and you can have development mode running without them installed. You can run development mode without running `bun i` and without getting a `node_modules` folder too, i.e. you can skip to step 3 without doing 1 and 2! That said, for developer experience things (such as editor autocompletion, TypeScript typing, automatic code formatting), you need the `node_modules`, so please still install Node.js, Bun and run `bun i` despite them not being strictly required by the development commands.

1. Install dependencies:

   ```
   bun i
   ```

1. Build the Docker images:

   ```
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
   ```

   This step takes a bit of time so go grab your coffee.

1. Spin up the Docker images:

   ```
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

   File system binding is already configured inside `docker-compose.dev.yml`.

1. Wait a few seconds for the images to boot up, then you can access the frontends at http://localhost:3000 (main frontend) and http://localhost:3001 (admin portal).

1. Now you can update the code locally and see the changes being reflected in real time.

1. If you make changes to `package.json` files, you need to rebuild the images again (step 1). If you make changes to other files outside the `apps` and the `services` folders _and_ you don't see the changes being reflected in real time, you also have to rebuild the images again.

1. To shut down the dev server, simply Ctrl+C then `docker-compose down`.

### Ports

The port used by each project is declared in the environment variable file.

## Frontend stuff

### Routing

We use [React Router](https://reactrouter.com), version 6. We only use the basic features of it though, because React Router likes to have crazy breaking changes in major releases that will mess it up if we integrate too deeply with the library. So don't use the loader feature; for data fetching, use SWR (see below).

Keep in mind that we use `<Link>` imported from `@peerprep/ui` instead of the `<Link>` from `react-router-dom`, so that we can support both internal links and external links.

### Data fetching

We fetch data with [SWR](https://swr.vercel.app). It is a pretty to use and lightweight library, quite similar to React Query. Please go to the link to check it out. Example:

```tsx
import type { Question } from "@peerprep/schemas";
import { questionsClient } from "@peerprep/utils/client";
import useSWR, { mutate } from "swr";

export function useQuestions() {
  return useSWR("questions:/", questionsClient.swrFetcher<Question[]>);
}

export async function mutateQuestions() {
  return mutate("questions:/");
}
```

`useQuestions()` will make a request to `/` of the questions service, getting the data whose type is `Question[]`. Whenever we make changes to the questions in the backend and want to tell SWR that the data has changed, we call `mutateQuestions()`, then it will send the request again and update the state in the frontend accordingly.

Thanks to SWR's [deduplication](https://swr.vercel.app/docs/advanced/performance.en-US#deduplication), we can reuse this hook anywhere we need the data in the app without having to use global state management libraries, contexts or prop drilling.

### Styling

We use [Tailwind CSS](https://tailwindcss.com). Many components use [Radix UI Primitives](https://www.radix-ui.com/primitives)/[Shadcn UI](https://ui.shadcn.com).

### Toasts

We use toasts to handle system messages sent to the user. Specifically, we use [`react-hot-toast`](https://react-hot-toast.com) to handle toasts. The toasts are already styled, so you only need to know that

```tsx
import toast from "react-hot-toast";
```

- Whenever something good happens, `toast.success("You won the jackpot, congrats!")`

- Whenever something bad happens, `toast.failure("You didn't win anything this time")`

## User service documentation

It is more or less the same as the provided user service.

| Method   | Route                   | Returned type                 | Description                                                                                                                  |
| -------- | ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/users`                | `void`                        | Create user **and also log that user in**                                                                                    |
| `GET`    | `/users`                | `User[]`                      | Get all users (requires admin account)                                                                                       |
| `GET`    | `/users/:id`            | `User`                        | Get user `id` (requires either admin account or authentication as user `id`). Return 404 response if the user doesn't exist. |
| `PATCH`  | `/users/:id`            | `void`                        | Update user `id` (requires either admin account or authentication as user `id`)                                              |
| `PATCH`  | `/users/:id/privileges` | `void`                        | Update user `id`'s admin status (requires admin account)                                                                     |
| `DELETE` | `/users/:id`            | `void`                        | Delete user `id` (requires either admin account or authentication as user `id`)                                              |
| `POST`   | `/auth/login`           | `void`                        | Log in with a given email and password                                                                                       |
| `POST`   | `/auth/logout`          | `void`                        | Log the current user out                                                                                                     |
| `GET`    | `/auth/verify-token`    | <code>User &#124; null</code> | Get the current authenticated user's data (similar to `/users/:id`, but return `null` when the request is not authenticated) |

### How authentication works

When you log in via `/auth/login`, the response will set a JWT token as a cookie in the user browser. Subsequent requests from the browser automatically carries that token, so there is no need to explicitly attach a bearer token in the `Authorization` header.

The token is shared across all `localhost` ports, so even though the user service is at localhost:x, requests to localhost:y still carry the token automatically. Note that if we are going to host the app on the internet, this step will need some additional handling.

The token expires after 1 month. There are currently no token rotation mechanism (i.e. you have to log in again after one month, regardless of how active or inactive you are) and no CSRF mitigation measures (which are not necessary[^2]).

[^2]: We handle actions via JSON-based requests, not `<form>` `POST` actions, so CSRF attacks are not applicable.

In Elysia, we can check for the auth token using the auth plugin from `@peerprep/utils`.

```tsx
new Elysia().use(elysiaAuthPlugin).get("/", ({ user }) => {
  console.log(user); // <- User if authenticated, null otherwise
});
```

## Question service documentation

| Method   | Route  | Returned type | Description                                                    |
| -------- | ------ | ------------- | -------------------------------------------------------------- |
| `POST`   | `/`    | `void`        | Create new questions (requires admin account)                  |
| `GET`    | `/`    | `Question[]`  | Get all questions                                              |
| `GET`    | `/:id` | `Question`    | Get question `id`. 404 response if the question doesn't exist. |
| `PATCH`  | `/:id` | `void`        | Update question `id` (requires admin account)                  |
| `DELETE` | `/:id` | `void`        | Delete question `id` (requires admin account)                  |

## `@peerprep/db`

Please take some time to familiarise yourself with [Prisma](https://prisma.io).

### Access database data

To access the database, simply use the `db` variable:

```tsx
import { db } from "@peerprep/db";

const users = await db.user.findMany();
```

### Update database schema

Ensure the database is online first by using either the development/production `docker-compose` commands specified above.

If the update is not a breaking change and doesn't affect existing data (e.g., the addition of a new database collection): Simply edit the schema file, then run `bun db:push` to send the update to the database.

If the update is a breaking change: Are you sure you want to do it?

That's why,

> [!IMPORTANT]
> Please avoid adding breaking changes to the schema. As such, please think of the schema design carefully when you design them so we don't have to do the tedious process of migrating database data later on.

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
- Add the environment variable name to the [`globalEnv` array in `turbo.json`](https://turbo.build/repo/docs/crafting-your-repository/using-environment-variables#environment-modes).

## `@peerprep/schemas`

We use the `t` utility imported from Elysia for validation, because we want to use these schema objects for [validation inside Elysia](https://elysiajs.com/validation/overview.html).

Refer to existing usage of `@peerprep/schemas` for more information.

## `@peerprep/ui`

This package has the UI components shared between the admin portal and the main PeerPrep frontend. In many components, [Radix UI Primitives](https://www.radix-ui.com/primitives) is used, based on a good styling configuration from [Shadcn UI](https://ui.shadcn.com).

### `cn`

This utility function exported from `@peerprep/ui/cn` should be used to make conditional classes rather than JS template strings.

```tsx
function Foo() {
  const isHorizontal = false;
  // ❌ Don't do this
  return <div className={`flex ${isHorizontal ? "flex-row" : "flex-col"}`}>Hello</div>;
  // ✅ Do this
  return <div className={cn("flex", isHorizontal ? "flex-row" : "flex-col")}>Hello</div>;
}
```

### `Button`

In the `variants` prop of the `Button` or `LinkButton`, you can specify the variant and the size of the button.

We have six sizes: `sm`, `md`, `lg` for textual buttons of different sizes, and `icon-sm`, `icon-md`, `icon-lg` for icon-only buttons.

We have three variants: `primary`, `secondary` and `ghost`.

### `Link`

This component from `@peerprep/ui/link` should be used to make links instead of raw `<a>` or `react-router-dom`'s `<Link>`.

Note that if the link should look like a button, `LinkButton` from `@peerprep/ui/button` should be used instead.

## `@peerprep/utils/server`

The `server` "subpackage" of the `@peerprep/utils` package contains the functions shared in all microservices (server-side). **This subpackage should not be imported into the frontend (client-side).**

### `ExpectedError`

First we need to know that there are two different types of errors.

The first type is unexpected errors. They are errors thrown when everything should have run fine, i.e. these are bugs in your code. For example, the user puts in the correct information, but user registration still fails. In this scenario, we will simply tell the user that "Something went wrong, sorry". These errors are 5xx errors ("developer messed up" errors).

The second type is expected errors. These occur when users make a mistake. For example: email already used by someone else, performing actions without logging in. In this scenario, it's not a code bug and we will give the user a friendly error message telling them what went wrong. These errors are 4xx errors ("user messed up" errors).

`ExpectedError` can be used in the backend microservices to handle the second type. Whenever such an error occurs, we provide `ExpectedError` with a user-friendly message and a status code, after which `elysiaFormatResponsePlugin` (see below) will handle it and return the correct message and status code to the user. Please use `http-status-codes` to make the code more readable.

```tsx
import { ExpectedError } from "@peerprep/utils/server";
import { StatusCodes } from "http-status-codes";

if (!email.includes("nus.edu")) {
  throw new ExpectedError(
    "This application is not available for people outside NUS",
    StatusCodes.FORBIDDEN,
  );
}
```

### `ServiceResponseBodySuccess<T>`, `ServiceResponseBodyError` and `ServiceResponseBody<T>`

`ServiceResponseBodySuccess<T>` is the JSON type of the successful responses from the microservices. For example, if the endpoint returns a list of users, the JSON body will have the type `ServiceResponseBodySuccess<User[]>`.

`ServiceResponseBodyError` is the JSON type of a failure response. It has the `error` field which contains a user-friendly error message that can be displayed to the user.

`ServiceResponseBody<T>` is simply the merger of the above two types: the JSON type of all responses from the microservices.

### `elysiaCorsPlugin`

This plugin handles [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). It should be leave as-is and used in all microservices.

### `elysiaFormatResponsePlugin`

This plugin uses Elysia hooks to ensure that all responses and errors are transformed into the valid response type with the body being `ServiceResponseBody<T>` documented above.

There isn't much you need to know or care about this plugin. Simply put it at the start of every microservice.

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
    if (!user?.isAdmin)
      throw new ExpectedError("Only admins can perform this action", StatusCodes.UNAUTHORIZED);
  })
  // The user is guaranteed to be an admin now
  .get("/", () => getAllUsers());
```

### `decorateUser`

We don't save the user's image URL (which is a [Gravatar URL](https://docs.gravatar.com/api/avatars/)) in the database, hence the raw database query will not return an image URL. This function's sole purpose is to add the image URL field from existing data returned from the database.

## `@peerprep/utils/client`

The `client` "subpackage" of the `@peerprep/utils` package contains the functions shared in all frontends. **This subpackage should not be imported into the microservices (server-side).**

The exported clients `userClient`, `questionsClient`, etc. can be used to send requests and get data from the corresponding microservices.

If the request fails, an error will be thrown. The function `getHTTPErrorMessage` is exported for you to get a user-friendly error message from that error.

Examples:

- Getting data:

  ```tsx
  try {
    const questionId = "12345";
    const question = await questionsClient.get<Question>(`/${questionId}`);
    console.log(question);
  } catch (e) {
    console.error(getHTTPErrorMessage(e));
  }
  ```

- Posting data:

  ```tsx
  try {
    await userClient.post("/auth/login", { json: { email, password } });
    console.log("Successfully logged in");
  } catch (e) {
    console.error(getHTTPErrorMessage(e));
  }
  ```

Note that where possible, we would prefer to use `useSWR` and `useSWRMutation` from `swr` to handle queries and mutations. Please check the SWR documentation and some sample code, such as `apps/admin-portal/src/lib/auth.ts`, for more details.

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

### Fix merge conflicts in lockfiles

If your PR has conflicts in lockfiles and cannot be merged, follow these steps. All of the commands should be run inside the branch you are trying to merge (not `main`):

1. Merge changes in `main` to your branch

   ```sh
   $ git merge main
   warning: Cannot merge binary files: bun.lockb (HEAD vs. main)
   Auto-merging bun.lockb
   CONFLICT (content): Merge conflict in bun.lockb
   Automatic merge failed; fix conflicts and then commit the result.
   ```

2. Remove the broken lockfile and recreate a new working lockfile

   ```sh
   $ rm bun.lockb
   $ bun i
   ```

3. Commit the new lockfile and push it

   ```sh
   $ git add .
   $ git commit -m "fix merge conflicts in bun.lockb"
   $ git push
   ```

Now the merge conflict should be removed.
