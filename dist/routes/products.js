"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.products = void 0;
const zod_1 = require("zod");
const firebase_1 = require("../lib/firebase");
const validateUserAuthorisation_1 = require("../lib/validateUserAuthorisation");
const products = async (app) => {
    app.post('/products', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        try {
            const bodySchema = zod_1.z.object({
                amountAvailable: zod_1.z.number(),
                cost: zod_1.z.number(),
                productName: zod_1.z.string(),
            });
            const { amountAvailable, cost, productName } = bodySchema.parse(request.body);
            const sellerId = request.userId;
            if (!sellerId) {
                return reply.status(400).send({ message: 'Missing seller ID' });
            }
            const seller = (await firebase_1.firestore.collection('users').doc(sellerId).get()).data();
            if ((seller === null || seller === void 0 ? void 0 : seller.role) !== 'seller') {
                return reply.status(401).send({ message: 'User is not a seller' });
            }
            const productRef = await firebase_1.firestore.collection('products').add({
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
            const snapshot = await firebase_1.firestore.collection('products').get();
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
            const paramsSchema = zod_1.z.object({
                id: zod_1.z.string(),
            });
            const params = paramsSchema.parse(request.params);
            const productId = params.id;
            if (!productId) {
                return reply.status(400).send({ message: 'Missing product ID' });
            }
            const productDoc = await firebase_1.firestore
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
    app.patch('/products/:id', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        var _a;
        try {
            const paramsSchema = zod_1.z.object({
                id: zod_1.z.string(),
            });
            const params = paramsSchema.parse(request.params);
            if (!params.id) {
                return reply.status(400).send({ message: 'Missing product ID' });
            }
            const bodySchema = zod_1.z.object({
                amountAvailable: zod_1.z.number().optional(),
                cost: zod_1.z.number().optional(),
                productName: zod_1.z.string().optional(),
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
            const seller = (await firebase_1.firestore.collection('users').doc(sellerId).get()).data();
            if ((seller === null || seller === void 0 ? void 0 : seller.role) !== 'seller') {
                return reply.status(401).send({ message: 'User is not a seller' });
            }
            const productDoc = await firebase_1.firestore
                .collection('products')
                .doc(productId)
                .get();
            if (!productDoc.exists) {
                return reply.status(404).send({ message: 'Product not found' });
            }
            else if (((_a = productDoc.data()) === null || _a === void 0 ? void 0 : _a.sellerId) !== sellerId) {
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
                await firebase_1.firestore
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
    app.delete('/products/:id', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        var _a;
        try {
            const paramsSchema = zod_1.z.object({
                id: zod_1.z.string(),
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
            const seller = (await firebase_1.firestore.collection('users').doc(sellerId).get()).data();
            if ((seller === null || seller === void 0 ? void 0 : seller.role) !== 'seller') {
                return reply.status(401).send({ message: 'User is not a seller' });
            }
            const productDoc = await firebase_1.firestore
                .collection('products')
                .doc(productId)
                .get();
            if (!productDoc.exists) {
                return reply.status(404).send({ message: 'Product not found' });
            }
            else if (((_a = productDoc.data()) === null || _a === void 0 ? void 0 : _a.sellerId) !== sellerId) {
                return reply
                    .status(403)
                    .send({ message: `Product doesn't belong to seller` });
            }
            else {
                await firebase_1.firestore.collection('products').doc(productId).delete();
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
exports.products = products;
