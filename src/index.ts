import 'dotenv/config';
import admin from 'firebase-admin';

import { fastifyApp } from './lib/fastify';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || ''
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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
