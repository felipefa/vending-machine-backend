import 'dotenv/config';

import { fastifyApp } from './lib/fastify';
import { createAccount } from './routes/createAccount';

fastifyApp.register(createAccount);

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
