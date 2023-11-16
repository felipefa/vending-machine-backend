import { z } from 'zod';
import { firestore } from '../lib/firebase';
import { validateUserAuthorisation } from '../lib/validateUserAuthorisation';
export const products = async (app) => {
    app.post('/products', { preHandler: validateUserAuthorisation }, async (request, reply) => {
        try {
            const bodySchema = z.object({
                amountAvailable: z.number(),
                cost: z.number(),
                productName: z.string(),
            });
            const { amountAvailable, cost, productName } = bodySchema.parse(request.body);
            const sellerId = request.userId;
            if (!sellerId) {
                return reply.status(400).send({ message: 'Missing seller ID' });
            }
            const seller = (await firestore.collection('users').doc(sellerId).get()).data();
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
            };
            return reply
                .status(201)
                .send({ message: 'Product creation successful', product });
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Product creation failed',
                error,
            });
        }
    });
    app.get('/products', async (_, reply) => {
        try {
            const products = [];
            const snapshot = await firestore.collection('products').get();
            snapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            return reply.status(200).send({ message: 'Products found', products });
        }
        catch (error) {
            return reply
                .status(500)
                .send({ message: 'Failed to get products', error });
        }
    });
    app.get('/products/:id', async (request, reply) => {
        try {
            const paramsSchema = z.object({
                id: z.string(),
            });
            const params = paramsSchema.parse(request.params);
            const productId = params.id;
            if (!productId) {
                return reply.status(400).send({ message: 'Missing product ID' });
            }
            const productDoc = await firestore
                .collection('products')
                .doc(productId)
                .get();
            if (!productDoc.exists) {
                return reply.status(404).send({ message: 'Product not found' });
            }
            return reply
                .status(200)
                .send({ message: 'Product found', product: productDoc.data() });
        }
        catch (error) {
            return reply
                .status(500)
                .send({ message: 'Failed to get product', error });
        }
    });
    app.patch('/products/:id', { preHandler: validateUserAuthorisation }, async (request, reply) => {
        try {
            const paramsSchema = z.object({
                id: z.string(),
            });
            const params = paramsSchema.parse(request.params);
            if (!params.id) {
                return reply.status(400).send({ message: 'Missing product ID' });
            }
            const bodySchema = z.object({
                amountAvailable: z.number().optional(),
                cost: z.number().optional(),
                productName: z.string().optional(),
            });
            const { amountAvailable, cost, productName } = bodySchema.parse(request.body);
            if (!amountAvailable && !cost && !productName) {
                return reply
                    .status(400)
                    .send({ message: 'Missing product update data' });
            }
            const productId = params.id;
            const sellerId = request.userId;
            if (!sellerId) {
                return reply.status(400).send({ message: 'Missing seller ID' });
            }
            const seller = (await firestore.collection('users').doc(sellerId).get()).data();
            if (seller?.role !== 'seller') {
                return reply.status(401).send({ message: 'User is not a seller' });
            }
            const productDoc = await firestore
                .collection('products')
                .doc(productId)
                .get();
            if (!productDoc.exists) {
                return reply.status(404).send({ message: 'Product not found' });
            }
            else if (productDoc.data()?.sellerId !== sellerId) {
                return reply
                    .status(403)
                    .send({ message: `Product doesn't belong to seller` });
            }
            else {
                const updatedProperties = {
                    ...(amountAvailable && { amountAvailable }),
                    ...(cost && { cost }),
                    ...(productName && { productName }),
                };
                await firestore
                    .collection('products')
                    .doc(productId)
                    .set(updatedProperties, { merge: true });
                const product = {
                    amountAvailable,
                    cost,
                    id: productId,
                    productName,
                    sellerId,
                };
                return reply
                    .status(200)
                    .send({ message: 'Product updated successfully', product });
            }
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Failed to update product',
                error: error.message,
            });
        }
    });
    app.delete('/products/:id', { preHandler: validateUserAuthorisation }, async (request, reply) => {
        try {
            const paramsSchema = z.object({
                id: z.string(),
            });
            const params = paramsSchema.parse(request.params);
            if (!params.id) {
                return reply.status(400).send({ message: 'Missing product ID' });
            }
            const productId = params.id;
            const sellerId = request.userId;
            if (!sellerId) {
                return reply.status(400).send({ message: 'Missing seller ID' });
            }
            const seller = (await firestore.collection('users').doc(sellerId).get()).data();
            if (seller?.role !== 'seller') {
                return reply.status(401).send({ message: 'User is not a seller' });
            }
            const productDoc = await firestore
                .collection('products')
                .doc(productId)
                .get();
            if (!productDoc.exists) {
                return reply.status(404).send({ message: 'Product not found' });
            }
            else if (productDoc.data()?.sellerId !== sellerId) {
                return reply
                    .status(403)
                    .send({ message: `Product doesn't belong to seller` });
            }
            else {
                await firestore.collection('products').doc(productId).delete();
                return reply.status(200).send({ message: 'Product deleted' });
            }
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Something went wrong when deleting product',
                error: error.message,
            });
        }
    });
};
