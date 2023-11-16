"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserAuthorisation = void 0;
const firebase_1 = require("./firebase");
async function validateUserAuthorisation(request, reply) {
    try {
        if (!request.headers.authorization) {
            return reply
                .status(401)
                .send({ message: 'Missing authorization header' });
        }
        const token = request.headers.authorization.replace('Bearer', '').trim();
        const decodedToken = await firebase_1.firebaseAdmin.auth().verifyIdToken(token);
        request.userId = decodedToken.uid;
    }
    catch (error) {
        return reply
            .status(401)
            .send({ message: 'Invalid token', error: error.message });
    }
}
exports.validateUserAuthorisation = validateUserAuthorisation;
