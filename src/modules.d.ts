import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  export interface FastifyRequestWithUser extends FastifyRequest {
    userId?: string;
  }
}
