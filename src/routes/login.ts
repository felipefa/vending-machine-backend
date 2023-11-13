import { FastifyInstance } from 'fastify';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { z } from 'zod';

import { firebaseAuth } from '../lib/firebase';

export async function login(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    try {
      const bodySchema = z.object({
        email: z.string(),
        password: z.string(),
      });

      const { email, password } = bodySchema.parse(request.body);

      const user = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      return reply
        .status(200)
        .send({ message: 'User successfully signed in', user });
    } catch (error) {
      return reply.status(500).send({
        message: 'Failed to sign in user',
        error: (error as Error).message,
      });
    }
  });
}
