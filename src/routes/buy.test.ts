import 'dotenv/config';

import fastify, { FastifyInstance } from 'fastify';
import { auth } from 'firebase-admin';

import { firebaseAdmin, firestore } from '../lib/firebase';
import { buy } from './buy';

describe('buy', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = fastify();

    app.register(buy);

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(jest.resetAllMocks);

  it('should successfully purchase a product', async () => {
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
      url: '/buy',
      payload: {
        productAmount: 1,
        productId: 'mockProductId',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty(
      'message',
      'Product successfully purchased'
    );
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
      url: '/buy',
      payload: {
        productAmount: 2,
        productId: 'mockProductId',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      message: 'User is not a buyer',
    });
  });

  it('should return 404 if product is not found', async () => {
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
    const getUndefined = jest.fn(async () => {
      return {
        data: () => undefined,
      } as unknown as FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
    });
    const set = jest.fn(async () => {});
    const doc = jest.fn((id) => ({
      get: id === 'nonExistentProductId' ? getUndefined : get,
      set,
    }));

    jest
      .spyOn(firestore, 'collection')
      .mockReturnValue({ doc } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/buy',
      payload: {
        productAmount: 2,
        productId: 'nonExistentProductId',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'Product not found',
    });
  });

  it('should return 400 if not enough product in stock', async () => {
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
    const getNotEnoughInStock = jest.fn(async () => {
      return {
        data: () => ({
          amountAvailable: 1,
          cost: 10,
          productName: 'Mock Product',
        }),
      } as unknown as FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
    });
    const set = jest.fn(async () => {});
    const doc = jest.fn((id) => ({
      get: id === 'notEnoughProductInStock' ? getNotEnoughInStock : get,
      set,
    }));

    jest
      .spyOn(firestore, 'collection')
      .mockReturnValue({ doc } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/buy',
      payload: {
        productAmount: 2,
        productId: 'notEnoughProductInStock',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: 'Not enough product in stock',
    });
  });

  it('should return 400 if user does not have enough funds', async () => {
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
    const getProduct = jest.fn(async () => {
      return {
        data: () => ({
          amountAvailable: 10,
          cost: 10,
          productName: 'Mock Product',
        }),
      } as unknown as FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
    });
    const set = jest.fn(async () => {});
    const doc = jest.fn((id) => ({
      get: id === 'productId' ? getProduct : get,
      set,
    }));

    jest
      .spyOn(firestore, 'collection')
      .mockReturnValue({ doc } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'POST',
      url: '/buy',
      payload: {
        productAmount: 10,
        productId: 'productId',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: 'User does not have enough funds',
    });
  });

  it('should return 500 if an error occurs during purchase', async () => {
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
      url: '/buy',
      payload: {
        productAmount: 2,
        productId: 'mockProductId',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      message: 'Failed to complete purchase',
      error: 'Firestore operation failed',
    });
  });
});
