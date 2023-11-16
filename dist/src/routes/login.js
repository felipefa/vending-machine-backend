import { signInWithEmailAndPassword } from 'firebase/auth';
import { z } from 'zod';
import { firebaseAuth, firestore } from '../lib/firebase';
export async function login(app) {
    app.post('/login', async (request, reply) => {
        try {
            const bodySchema = z.object({
                email: z.string(),
                password: z.string(),
            });
            const { email, password } = bodySchema.parse(request.body);
            const authUser = await signInWithEmailAndPassword(firebaseAuth, email, password);
            const userIdToken = authUser._tokenResponse
                ?.idToken;
            if (!userIdToken) {
                throw new Error('Failed to get user id token');
            }
            const userDoc = await firestore
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
