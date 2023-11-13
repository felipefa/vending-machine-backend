import 'dotenv/config';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

import { firebaseAdmin } from '../lib/firebaseAdmin';
import { firestore } from '../lib/firestore';

import { server as fastifyApp } from '../server';

describe('createAccount', () => {
  afterAll(async () => await fastifyApp.close());
  afterEach(jest.resetAllMocks);

  it('should create a new account', async () => {
    jest
      .spyOn(firebaseAdmin.auth(), 'createUser')
      .mockImplementation(async () => {
        return {
          uid: 'uuid',
        } as UserRecord;
      });

    jest
      .spyOn(firestore.collection('users').doc('uuid'), 'set')
      .mockImplementation(async () => {
        return {} as FirebaseFirestore.WriteResult;
      });

    const response = await fastifyApp.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'test@email.com',
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

  it('should fail when required fields are missing', async () => {
    const response = await fastifyApp.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'test@example.com',
        password: 'password',
        // role and username are missing
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toHaveProperty(
      'message',
      'Account creation failed'
    );
  });

  it('should fail when Firebase admin operation fails', async () => {
    jest.spyOn(firebaseAdmin.auth(), 'createUser').mockImplementation(() => {
      throw new Error('Firebase admin operation failed');
    });

    const response = await fastifyApp.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'test@example.com',
        password: 'password',
        role: 'buyer',
        username: 'testuser',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      message: 'Account creation failed',
      error: 'Firebase admin operation failed',
    });
  });

  it('should fail when Firestore operation fails', async () => {
    jest
      .spyOn(firebaseAdmin.auth(), 'createUser')
      .mockImplementation(async () => {
        return {
          uid: 'uuid',
        } as UserRecord;
      });

    jest.spyOn(firestore, 'collection').mockImplementation(() => {
      throw new Error('Firestore operation failed');
    });

    const response = await fastifyApp.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'test@example.com',
        password: 'password',
        role: 'buyer',
        username: 'testuser',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      message: 'Account creation failed',
      error: 'Firestore operation failed',
    });
  });
});
