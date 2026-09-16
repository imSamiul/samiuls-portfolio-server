"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Thrown by services and middleware so the central error handler can turn a
// failure into the right status code instead of every controller guessing.
class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.default = ApiError;
