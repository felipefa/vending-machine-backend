import 'dotenv/config';

import { fastifyApp } from './lib/fastify';
import { deposit } from './routes/deposit';
import { login } from './routes/login';
import { products } from './routes/products';
import { reset } from './routes/reset';
import { users } from './routes/users';

fastifyApp.register(deposit);
fastifyApp.register(login);
fastifyApp.register(products);
fastifyApp.register(reset);
fastifyApp.register(users);

fastifyApp.get('/', async (_, reply) => {
  return reply.send({ success: true, message: 'Vending machine is running!' });
});

const port = Number(process.env.PORT) || 3000;

fastifyApp.listen({ port }, (err, address) => {
  if (err) {
    fastifyApp.log.error(err);
    process.exit(1);
  }

  console.log(`Server listening on ${address}`);
});

export const server = fastifyApp;
