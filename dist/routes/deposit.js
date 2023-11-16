"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deposit = void 0;
const zod_1 = require("zod");
const firebase_1 = require("../lib/firebase");
const validateUserAuthorisation_1 = require("../lib/validateUserAuthorisation");
async function deposit(app) {
    app.post('/deposit', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        try {
            const bodySchema = zod_1.z.object({
                coin: zod_1.z.number().int().positive(),
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
            const userDoc = await firebase_1.firestore.collection('users').doc(userId).get();
            const user = userDoc.data();
            if ((user === null || user === void 0 ? void 0 : user.role) !== 'buyer') {
                return reply.status(403).send({
                    message: 'User is not a buyer',
                });
            }
            const deposit = ((user === null || user === void 0 ? void 0 : user.deposit) || 0) + coin;
            await firebase_1.firestore
                .collection('users')
                .doc(userId)
                .set({ deposit }, { merge: true });
            return reply.status(200).send({
                message: 'Coin successfully deposited',
                deposit,
            });
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Failed to deposit coin',
                error: error.message,
            });
        }
    });
}
exports.deposit = deposit;
