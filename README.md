# Vending Machine Backend

Backend for a vending machine application that allows users to sell and buy products.

## Description

This application was built as part of a coding challenge together with [vending-machine-web](https://github.com/felipefa/vending-machine-web).

The idea is to provide a backend that allows users to sell and buy products from a vending machine.

The endpoints available for this app can be tested using the rest client of your choice, thought I recommend the [Rest Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for VSCode. There are files defined in the [restClient](https://github.com/felipefa/vending-machine-backend/tree/main/restClient) folder that can be used to test the endpoints.

The application was built using the following technologies:

- [Fastify](https://www.fastify.io/)
- [Firebase](https://firebase.google.com/)
- [Jest](https://jestjs.io/)
- [Node.js](https://nodejs.org/en/)
- [Typescript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev)

## How to run

Before running the application, you will need to create a Firebase project and enable the Firestore database. You can follow the steps described in the [Firebase documentation](https://firebase.google.com/docs/firestore/quickstart#create).

- Create a new `.env` file based on the `.env.example` file.

- Install the dependencies:

```bash
pnpm install
```

- Run the application:

```bash
pnpm run dev
```
