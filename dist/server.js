"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
require("dotenv/config");
const fastify_1 = require("./lib/fastify");
const buy_1 = require("./routes/buy");
const deposit_1 = require("./routes/deposit");
const login_1 = require("./routes/login");
const products_1 = require("./routes/products");
const reset_1 = require("./routes/reset");
const users_1 = require("./routes/users");
fastify_1.fastifyApp.register(buy_1.buy);
fastify_1.fastifyApp.register(deposit_1.deposit);
fastify_1.fastifyApp.register(login_1.login);
fastify_1.fastifyApp.register(products_1.products);
fastify_1.fastifyApp.register(reset_1.reset);
fastify_1.fastifyApp.register(users_1.users);
fastify_1.fastifyApp.get('/', async (_, reply) => {
    return reply.send({ success: true, message: 'Vending machine is running!' });
});
const port = Number(process.env.PORT) || 3000;
fastify_1.fastifyApp.listen({ port }, (err, address) => {
    if (err) {
        fastify_1.fastifyApp.log.error(err);
        process.exit(1);
    }
    console.log(`Server listening on ${address}`);
});
exports.server = fastify_1.fastifyApp;
