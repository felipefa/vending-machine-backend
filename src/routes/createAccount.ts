import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { firebaseAdmin } from '../lib/firebaseAdmin';
import { firestore } from '../lib/firestore';

export async function createAccount(app: FastifyInstance) {
  app.post('/createAccount', async (request, reply) => {
    try {
      const bodySchema = z.object({
        email: z.string(),
        password: z.string(),
        role: z.enum(['buyer', 'seller']),
        username: z.string(),
      });

      const { email, password, role, username } = bodySchema.parse(
        request.body
      );

      const userRecord = await firebaseAdmin.auth().createUser({
        email,
        password,
      });

      await firestore.collection('users').doc(userRecord.uid).set({
        email,
        username,
        role,
      });

      reply.code(201).send({ message: 'Account creation successful' });
    } catch (error) {
      reply.code(500).send({
        message: 'Account creation failed',
        error: (error as Error).message,
      });
    }
  });
}
