import { FastifyInstance, FastifyReply, FastifyRequestWithUser } from 'fastify';
import { z } from 'zod';

import { firestore } from '../lib/firestore';
import { validateUserAuthorisation } from '../lib/validateUserAuthorisation';

interface Product {
  amountAvailable: number;
  cost: number;
  id: string;
  productName: string;
  sellerId: string;
}

export const products = async (app: FastifyInstance) => {
  app.post(
    '/products',
    { preHandler: validateUserAuthorisation },
    async (request: FastifyRequestWithUser, reply: FastifyReply) => {
      try {
        const bodySchema = z.object({
          amountAvailable: z.number(),
          cost: z.number(),
          productName: z.string(),
        });

        const { amountAvailable, cost, productName } = bodySchema.parse(
          request.body
        );

        const sellerId = request.userId;

        if (!sellerId) {
          return reply.status(400).send({ message: 'Missing seller ID' });
        }

        const seller = (
          await firestore.collection('users').doc(sellerId).get()
        ).data();

        if (seller?.role !== 'seller') {
          return reply.status(401).send({ message: 'User is not a seller' });
        }

        const productRef = await firestore.collection('products').add({
          amountAvailable,
          cost,
          productName,
          sellerId,
        });

        const product = {
          amountAvailable,
          cost,
          id: productRef.id,
          productName,
          sellerId,
        } as Product;

        return reply
          .status(201)
          .send({ message: 'Product creation successful', product });
      } catch (error) {
        return reply.status(500).send({
          message: 'Product creation failed',
          error,
        });
      }
    }
  );

  app.get('/products', async (_, reply: FastifyReply) => {
    try {
      const products: Product[] = [];
      const snapshot = await firestore.collection('products').get();

      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });

      return reply.status(200).send({ message: 'Products found', products });
    } catch (error) {
      return reply
        .status(500)
        .send({ message: 'Failed to get products', error });
    }
  });
};
