import { fastifyCors } from '@fastify/cors';
import fastify from 'fastify';

const app = fastify();

app.register(fastifyCors, {
  origin: process.env.FRONTEND_URL,
});

export const fastifyApp = app;
