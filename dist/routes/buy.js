"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buy = void 0;
const zod_1 = require("zod");
const firebase_1 = require("../lib/firebase");
const validateUserAuthorisation_1 = require("../lib/validateUserAuthorisation");
const getChangeInCoins_1 = require("../utils/getChangeInCoins");
async function buy(app) {
    app.post('/buy', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        try {
            const bodySchema = zod_1.z.object({
                productAmount: zod_1.z.number().int().positive(),
                productId: zod_1.z.string(),
            });
            const { productAmount, productId } = bodySchema.parse(request.body);
            const userId = request.userId;
            if (!userId) {
                return reply.status(401).send({
                    message: 'User is not signed in',
                });
            }
            const userDoc = await firebase_1.firestore.collection('users').doc(userId).get();
            const user = userDoc.data();
            if ((user === null || user === void 0 ? void 0 : user.role) !== 'buyer') {
                return reply.status(403).send({
                    message: 'User is not a buyer',
                });
            }
            const productDoc = await firebase_1.firestore
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
            if ((user === null || user === void 0 ? void 0 : user.deposit) < totalCost) {
                return reply.status(400).send({
                    message: 'User does not have enough funds',
                });
            }
            const change = (0, getChangeInCoins_1.getChangeInCoins)(user.deposit - totalCost);
            await firebase_1.firestore
                .collection('products')
                .doc(productId)
                .set({ amountAvailable: product.amountAvailable - productAmount }, { merge: true });
            await firebase_1.firestore
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
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Failed to complete purchase',
                error: error.message,
            });
        }
    });
}
exports.buy = buy;
