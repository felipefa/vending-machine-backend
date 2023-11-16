import { firestore } from '../lib/firebase';
import { validateUserAuthorisation } from '../lib/validateUserAuthorisation';
export async function reset(app) {
    app.post('/reset', { preHandler: validateUserAuthorisation }, async (request, reply) => {
        try {
            const userId = request.userId;
            if (!userId) {
                return reply.status(401).send({
                    message: 'User is not signed in',
                });
            }
            const userDoc = await firestore.collection('users').doc(userId).get();
            const user = userDoc.data();
            if (user?.role !== 'buyer') {
                return reply.status(403).send({
                    message: 'User is not a buyer',
                });
            }
            await firestore
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
