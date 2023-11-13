import { FastifyInstance, FastifyRequestWithUser } from 'fastify';
import { z } from 'zod';

import { firestore } from '../lib/firebase';
import { validateUserAuthorisation } from '../lib/validateUserAuthorisation';

export async function deposit(app: FastifyInstance) {
  app.post(
    '/deposit',
    { preHandler: validateUserAuthorisation },
    async (request: FastifyRequestWithUser, reply) => {
      try {
        const bodySchema = z.object({
          coin: z.number().int().positive(),
        });

        const { coin } = bodySchema.parse(request.body);

        const userId = request.userId;

        if (!userId) {
          return reply.status(401).send({
            message: 'User is not signed in',
          });
        }

        if (![5, 10, 20, 50, 100].includes(coin)) {
          return reply.status(400).send({
            message: 'Invalid coin',
            coin,
          });
        }

        const userDoc = await firestore.collection('users').doc(userId).get();

        const user = userDoc.data();

        if (user?.role !== 'buyer') {
          return reply.status(403).send({
            message: 'User is not a buyer',
          });
        }

        const deposit = (user?.deposit || 0) + coin;

        await firestore
          .collection('users')
          .doc(userId)
          .set({ deposit }, { merge: true });

        return reply.status(200).send({
          message: 'Coin successfully deposited',
          deposit,
        });
      } catch (error) {
        return reply.status(500).send({
          message: 'Failed to deposit coin',
          error: (error as Error).message,
        });
      }
    }
  );
}
