"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastifyApp = void 0;
const cors_1 = require("@fastify/cors");
const fastify_1 = __importDefault(require("fastify"));
const app = (0, fastify_1.default)();
app.register(cors_1.fastifyCors, {
    origin: process.env.FRONTEND_URL,
});
exports.fastifyApp = app;
