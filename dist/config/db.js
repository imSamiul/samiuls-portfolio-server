"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
let connection = null;
// Memoised so the standalone server and the Vercel entry can both ask for a
// connection without opening a second pool.
function connectDB() {
    if (!connection) {
        connection = mongoose_1.default.connect(env_1.env.DB_URL, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
        });
    }
    return connection;
}
function disconnectDB() {
    connection = null;
    return mongoose_1.default.disconnect();
}
