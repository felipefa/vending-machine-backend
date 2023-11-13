import { FastifyInstance, FastifyReply, FastifyRequestWithUser } from 'fastify';
import { z } from 'zod';

import { firebaseAdmin, firestore } from '../lib/firebase';
import { validateUserAuthorisation } from '../lib/validateUserAuthorisation';

export async function users(app: FastifyInstance) {
  app.post('/users', async (request, reply) => {
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

      const possibleUser = await firestore
        .collection('users')
        .where('username', '==', username)
        .get();

      if (!possibleUser.empty) {
        return reply.code(400).send({
          message: 'Account creation failed',
          error: 'Username already exists',
        });
      }

      const user = {
        createdAt: new Date(),
        deposit: 0,
        email,
        id: userRecord.uid,
        role,
        username,
      };

      await firestore.collection('users').doc(userRecord.uid).create(user);

      return reply
        .status(201)
        .send({ message: 'Account creation successful', user });
    } catch (error) {
      return reply.status(500).send({
        message: 'Account creation failed',
        error: (error as Error).message,
      });
    }
  });

  app.get(
    '/users/:id',
    { preHandler: validateUserAuthorisation },
    async (request: FastifyRequestWithUser, reply) => {
      try {
        const paramsSchema = z.object({
          id: z.string(),
        });

        const params = paramsSchema.parse(request.params);
        const userId = params.id;

        if (!userId) {
          return reply.status(400).send({ message: 'Missing user ID' });
        }

        const userDoc = await firestore.collection('users').doc(userId).get();

        if (!userDoc.exists) {
          return reply.status(404).send({ message: 'User not found' });
        }

        return reply
          .status(200)
          .send({ message: 'User found', user: userDoc.data() });
      } catch (error) {
        return reply.status(500).send({ message: 'Failed to get user', error });
      }
    }
  );

  app.delete(
    '/users',
    { preHandler: validateUserAuthorisation },
    async (request: FastifyRequestWithUser, reply: FastifyReply) => {
      try {
        const userId = request.userId;

        if (!userId) {
          return reply.status(400).send({ message: 'Missing user ID' });
        }

        const batch = firestore.batch();

        const productsSnapshot = await firestore
          .collection('products')
          .where('sellerId', '==', userId)
          .get();

        productsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();

        await firestore.collection('users').doc(userId).delete();

        return reply.status(200).send({ message: 'User deleted' });
      } catch (error) {
        return reply.status(500).send({
          message: 'Something went wrong while deleting user',
          error: (error as Error).message,
        });
      }
    }
  );
}
