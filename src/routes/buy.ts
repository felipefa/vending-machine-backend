import { FastifyInstance, FastifyRequestWithUser } from 'fastify';
import { z } from 'zod';

import { firestore } from '../lib/firebase';
import { validateUserAuthorisation } from '../lib/validateUserAuthorisation';
import { getChangeInCoins } from '../utils/getChangeInCoins';

export async function buy(app: FastifyInstance) {
  app.post(
    '/buy',
    { preHandler: validateUserAuthorisation },
    async (request: FastifyRequestWithUser, reply) => {
      try {
        const bodySchema = z.object({
          productAmount: z.number().int().positive(),
          productId: z.string(),
        });

        const { productAmount, productId } = bodySchema.parse(request.body);

        const userId = request.userId;

        if (!userId) {
          return reply.status(401).send({
            message: 'User is not signed in',
          });
        }

        const userDoc = await firestore.collection('users').doc(userId).get();

        const user = userDoc.data();

        if (user?.role !== 'buyer') {
          return reply.status(403).send({
            message: 'User is not a buyer',
          });
        }

        const productDoc = await firestore
          .collection('products')
          .doc(productId)
          .get();

        const product = productDoc.data();

        if (!product) {
          return reply.status(404).send({
            message: 'Product not found',
          });
        }

        if (product.amountAvailable < productAmount) {
          return reply.status(400).send({
            message: 'Not enough product in stock',
          });
        }

        const totalCost = product.cost * productAmount;

        if (user?.deposit < totalCost) {
          return reply.status(400).send({
            message: 'User does not have enough funds',
          });
        }

        const change = getChangeInCoins(user.deposit - totalCost);

        await firestore
          .collection('products')
          .doc(productId)
          .set(
            { amountAvailable: product.amountAvailable - productAmount },
            { merge: true }
          );

        await firestore
          .collection('users')
          .doc(userId)
          .set({ deposit: 0 }, { merge: true });

        return reply.status(200).send({
          message: 'Product successfully purchased',
          productName: product.productName,
          amountPurchased: productAmount,
          unitCost: product.cost,
          totalCost,
          change,
        });
      } catch (error) {
        return reply.status(500).send({
          message: 'Failed to complete purchase',
          error: (error as Error).message,
        });
      }
    }
  );
}
