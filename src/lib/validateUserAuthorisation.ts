import { FastifyReply, FastifyRequest, FastifyRequestWithUser } from 'fastify';

import { firebaseAdmin } from './firebaseAdmin';

export async function validateUserAuthorisation(
  request: FastifyRequestWithUser,
  reply: FastifyReply
) {
  try {
    if (!request.headers.authorization) {
      return reply
        .status(401)
        .send({ message: 'Missing authorization header' });
    }

    const token = request.headers.authorization.split(' ')[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

    request.userId = decodedToken.uid;
  } catch (error) {
    return reply
      .status(401)
      .send({ message: 'Invalid token', error: (error as Error).message });
  }
}
