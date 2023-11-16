import { firebaseAdmin } from './firebase';
export async function validateUserAuthorisation(request, reply) {
    try {
        if (!request.headers.authorization) {
            return reply
                .status(401)
                .send({ message: 'Missing authorization header' });
        }
        const token = request.headers.authorization.replace('Bearer', '').trim();
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        request.userId = decodedToken.uid;
    }
    catch (error) {
        return reply
            .status(401)
            .send({ message: 'Invalid token', error: error.message });
    }
}
