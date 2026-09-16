"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// Define base UserType schema
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true,
    },
}, {
    timestamps: true,
});
userSchema.pre('save', function hashPassword(next) {
    return __awaiter(this, void 0, void 0, function* () {
        // this gives to individual UserType that i will save
        if (this.isModified('password')) {
            this.password = yield bcrypt_1.default.hash(this.password, 8);
        }
        next();
    });
});
userSchema.methods.generateAuthToken = function generateAuthToken() {
    return __awaiter(this, void 0, void 0, function* () {
        return jsonwebtoken_1.default.sign({ id: this.id.toString() }, env_1.env.JWT_TOKEN, {
            expiresIn: '7d',
        });
    });
};
userSchema.methods.toJSON = function toJSON() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};
// Static method to find user by credentials
userSchema.statics.findByCredentials = function (email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const foundUser = yield this.findOne({ email });
        if (!foundUser) {
            return null;
        }
        const isMatch = yield bcrypt_1.default.compare(password, foundUser.password);
        if (!isMatch) {
            return null;
        }
        return foundUser;
    });
};
// Create the base model
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
