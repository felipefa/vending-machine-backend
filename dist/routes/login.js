"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const auth_1 = require("firebase/auth");
const zod_1 = require("zod");
const firebase_1 = require("../lib/firebase");
async function login(app) {
    app.post('/login', async (request, reply) => {
        var _a;
        try {
            const bodySchema = zod_1.z.object({
                email: zod_1.z.string(),
                password: zod_1.z.string(),
            });
            const { email, password } = bodySchema.parse(request.body);
            const authUser = await (0, auth_1.signInWithEmailAndPassword)(firebase_1.firebaseAuth, email, password);
            const userIdToken = (_a = authUser._tokenResponse) === null || _a === void 0 ? void 0 : _a.idToken;
            if (!userIdToken) {
                throw new Error('Failed to get user id token');
            }
            const userDoc = await firebase_1.firestore
                .collection('users')
                .doc(authUser.user.uid)
                .get();
            const user = userDoc.data();
            return reply
                .status(200)
                .send({ message: 'User successfully signed in', user, userIdToken });
        }
        catch (error) {
            return reply.status(500).send({
                message: 'Failed to sign in user',
                error: error.message,
            });
        }
    });
}
exports.login = login;
