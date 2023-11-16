"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const zod_1 = require("zod");
const firebase_1 = require("../lib/firebase");
const validateUserAuthorisation_1 = require("../lib/validateUserAuthorisation");
async function users(app) {
    app.post('/users', async (request, reply) => {
        try {
            const bodySchema = zod_1.z.object({
                email: zod_1.z.string(),
                password: zod_1.z.string(),
                role: zod_1.z.enum(['buyer', 'seller']),
                username: zod_1.z.string(),
            });
            const { email, password, role, username } = bodySchema.parse(request.body);
            const userRecord = await firebase_1.firebaseAdmin.auth().createUser({
                email,
                password,
            });
            const possibleUser = await firebase_1.firestore
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
            await firebase_1.firestore.collection('users').doc(userRecord.uid).create(user);
            return reply
                .status(201)
                .send({ message: 'Account creation successful', user });
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Account creation failed',
                error: error.message,
            });
        }
    });
    app.get('/users/:id', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        try {
            const paramsSchema = zod_1.z.object({
                id: zod_1.z.string(),
            });
            const params = paramsSchema.parse(request.params);
            const userId = params.id;
            if (!userId) {
                return reply.status(400).send({ message: 'Missing user ID' });
            }
            const userDoc = await firebase_1.firestore.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return reply.status(404).send({ message: 'User not found' });
            }
            return reply
                .status(200)
                .send({ message: 'User found', user: userDoc.data() });
        }
        catch (error) {
            return reply.status(500).send({ message: 'Failed to get user', error });
        }
    });
    app.patch('/users', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        try {
            const bodySchema = zod_1.z.object({
                username: zod_1.z.string(),
            });
            const { username } = bodySchema.parse(request.body);
            const userId = request.userId;
            if (!userId) {
                return reply.status(400).send({ message: 'Missing user ID' });
            }
            await firebase_1.firestore
                .collection('users')
                .doc(userId)
                .set({ username }, { merge: true });
            return reply.status(200).send({ message: 'User updated successfully' });
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Failed to update user',
                error: error.message,
            });
        }
    });
    app.delete('/users', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        try {
            const userId = request.userId;
            if (!userId) {
                return reply.status(400).send({ message: 'Missing user ID' });
            }
            const batch = firebase_1.firestore.batch();
            const productsSnapshot = await firebase_1.firestore
                .collection('products')
                .where('sellerId', '==', userId)
                .get();
            productsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            await firebase_1.firestore.collection('users').doc(userId).delete();
            return reply.status(200).send({ message: 'User deleted' });
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Something went wrong while deleting user',
                error: error.message,
            });
        }
    });
}
exports.users = users;
