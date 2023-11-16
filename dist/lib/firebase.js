"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestore = exports.firebaseAdmin = exports.firebaseAuth = exports.firebaseApp = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firebaseOptions = JSON.parse(process.env.FIREBASE_OPTIONS || '');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '');
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
exports.firebaseApp = (0, app_1.initializeApp)(firebaseOptions);
exports.firebaseAuth = (0, auth_1.initializeAuth)(exports.firebaseApp);
exports.firebaseAdmin = firebase_admin_1.default;
exports.firestore = exports.firebaseAdmin.firestore();
