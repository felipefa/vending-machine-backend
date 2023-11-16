"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reset = void 0;
const firebase_1 = require("../lib/firebase");
const validateUserAuthorisation_1 = require("../lib/validateUserAuthorisation");
async function reset(app) {
    app.post('/reset', { preHandler: validateUserAuthorisation_1.validateUserAuthorisation }, async (request, reply) => {
        try {
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
            await firebase_1.firestore
                .collection('users')
                .doc(userId)
                .set({ deposit: 0 }, { merge: true });
            return reply.status(200).send({
                message: 'Deposit successfully reset',
                deposit: 0,
            });
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Failed to reset deposit',
                error: error.message,
            });
        }
    });
}
exports.reset = reset;
