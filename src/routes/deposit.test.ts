import 'dotenv/config';

import fastify, { FastifyInstance } from 'fastify';
import { auth } from 'firebase-admin';

import { firebaseAdmin, firestore } from '../lib/firebase';
import { deposit } from './deposit';

describe('deposit', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = fastify();

    app.register(deposit);

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(jest.resetAllMocks);

  it('should successfully deposit a coin', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    const get = jest.fn(async () => {
      return {
        data: () => ({
          deposit: 50,
          role: 'buyer',
        }),
      } as unknown as FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
    });
    const set = jest.fn(async () => {});
    const doc = jest.fn(() => ({ get, set }));

    jest
      .spyOn(firestore, 'collection')
      .mockReturnValue({ doc } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/deposit',
      payload: {
        coin: 10,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty(
      'message',
      'Coin successfully deposited'
    );
    expect(response.json()).toHaveProperty('deposit', 60);
  });

  it('should return 401 if user is not signed in', async () => {
    jest
      .spyOn(firebaseAdmin.auth(), 'verifyIdToken')
      .mockReturnValue((async () => '' as unknown as auth.DecodedIdToken)());

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/deposit',
      payload: {
        coin: 10,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'User is not signed in',
    });
  });

  it('should return 400 if coin is invalid', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/deposit',
      payload: {
        coin: 30,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: 'Invalid coin',
      coin: 30,
    });
  });

  it('should return 403 if user is not a buyer', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    const get = jest.fn(async () => {
      return {
        data: () => ({
          deposit: 50,
          role: 'seller',
        }),
      } as unknown as FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
    });
    const set = jest.fn(async () => {});
    const doc = jest.fn(() => ({ get, set }));

    jest
      .spyOn(firestore, 'collection')
      .mockReturnValue({ doc } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/deposit',
      payload: {
        coin: 10,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      message: 'User is not a buyer',
    });
  });

  it('should return 500 if an error occurs during deposit', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    const get = jest.fn(async () => {
      return {
        data: () => ({
          deposit: 50,
          role: 'buyer',
        }),
      } as unknown as FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
    });
    const set = jest.fn(async () => {
      throw new Error('Firestore operation failed');
    });
    const doc = jest.fn(() => ({ get, set }));

    jest
      .spyOn(firestore, 'collection')
      .mockReturnValue({ doc } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/deposit',
      payload: {
        coin: 10,
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      message: 'Failed to deposit coin',
      error: 'Firestore operation failed',
    });
  });
});
