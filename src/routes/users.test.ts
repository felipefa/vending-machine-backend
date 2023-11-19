import 'dotenv/config';

import fastify, { FastifyInstance } from 'fastify';
import { auth } from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

import { firebaseAdmin, firestore } from '../lib/firebase';
import { users } from './users';

describe('users', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = fastify();

    app.register(users);

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(jest.resetAllMocks);

  it('should create a new user', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'createUser').mockResolvedValue({
      uid: 'mockUserId',
    } as UserRecord);

    const get = jest.fn(async () => ({
      empty: true,
    }));
    const create = jest.fn(async () => {});
    const where = jest.fn(() => ({
      get,
    }));
    const doc = jest.fn(() => ({
      get,
      create,
    }));

    jest.spyOn(firestore, 'collection').mockReturnValue({
      doc,
      where,
    } as unknown as any);

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'test@example.com',
        password: 'password',
        role: 'buyer',
        username: 'testuser',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty(
      'message',
      'Account creation successful'
    );
  });

  it('should return an error if username already exists', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'createUser').mockResolvedValue({
      uid: 'mockUserId',
    } as UserRecord);

    const get = jest.fn(async () => ({
      empty: false,
      data: () => ({
        username: 'existingUser',
      }),
    }));
    const where = jest.fn(() => ({
      get,
    }));
    const doc = jest.fn(() => ({
      get,
    }));

    jest
      .spyOn(firestore, 'collection')
      .mockReturnValue({ doc, where } as unknown as any);

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'test@example.com',
        password: 'password',
        role: 'buyer',
        username: 'existingUser',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: 'Account creation failed',
      error: 'Username already exists',
    });
  });

  it('should get a user by ID', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    jest.spyOn(firestore, 'collection').mockReturnValue({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            id: 'mockUserId',
            username: 'testuser',
          }),
        }),
      })),
    } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'GET',
      url: '/users/mockUserId',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: 'User found',
      user: {
        id: 'mockUserId',
        username: 'testuser',
      },
    });
  });

  it('should return an error if user is not found', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    jest.spyOn(firestore, 'collection').mockReturnValue({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      })),
    } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'GET',
      url: '/users/nonExistentUserId',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'User not found',
    });
  });

  it('should update a user', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    const set = jest.fn(async () => {});

    jest.spyOn(firestore, 'collection').mockReturnValue({
      doc: jest.fn(() => ({
        set,
      })),
    } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'PATCH',
      url: '/users',
      payload: {
        username: 'newusername',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: 'User updated successfully',
    });
    expect(set).toHaveBeenCalledWith(
      { username: 'newusername' },
      { merge: true }
    );
  });

  it('should delete a user', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'verifyIdToken').mockReturnValue(
      (async () =>
        ({
          uid: 'mockUserId',
        } as auth.DecodedIdToken))()
    );

    const deleteFn = jest.fn(async () => {});
    const batchCommit = jest.fn(async () => {});

    jest.spyOn(firestore, 'collection').mockReturnValue({
      doc: jest.fn(() => ({
        delete: deleteFn,
      })),
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          docs: [
            {
              ref: {
                delete: deleteFn,
              },
            },
          ],
        }),
      })),
    } as unknown as any);

    jest.spyOn(firestore, 'batch').mockReturnValue({
      delete: deleteFn,
      commit: batchCommit,
    } as unknown as any);

    const response = await app.inject({
      headers: { authorization: 'Bearer userIdToken' },
      method: 'DELETE',
      url: '/users',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: 'User deleted',
    });
    expect(deleteFn).toHaveBeenCalledTimes(2);
    expect(batchCommit).toHaveBeenCalled();
  });
});
