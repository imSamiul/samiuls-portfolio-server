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
exports.handleSignUp = void 0;
exports.handleLogin = handleLogin;
const user_model_1 = __importDefault(require("../models/user.model"));
// POST: Login User using form
function handleLogin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        if (email !== 'samiulkarimprodhan@gmail.com') {
            res.status(400).send({ message: 'You are not valid for this website.' });
            return;
        }
        try {
            const loginSuccessfulUser = yield user_model_1.default.findByCredentials(email, password);
            if (loginSuccessfulUser) {
                const token = yield loginSuccessfulUser.generateAuthToken();
                res.status(201).send({ user: loginSuccessfulUser, token });
                return;
            }
        }
        catch (error) {
            let errorMessage = 'Failed to load the client list';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.log(error);
            res.status(500).json({ message: errorMessage });
            return;
        }
    });
}
// POST: SingUp User using form
const handleSignUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (email !== 'samiulkarimprodhan@gmail.com') {
        res.status(400).send({ message: 'You are not valid for this website.' });
        return;
    }
    try {
        const user = new user_model_1.default({ email, password });
        yield user.save();
        const token = yield user.generateAuthToken();
        res.status(201).send({ user, token });
        return;
    }
    catch (error) {
        let errorMessage = 'Failed to load the client list';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).json({ message: errorMessage });
        console.log(error);
        return;
    }
});
exports.handleSignUp = handleSignUp;
