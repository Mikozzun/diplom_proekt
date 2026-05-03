"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenPair = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const generateAccessToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'access' }, env_1.env.jwtSecret, {
        expiresIn: '15m',
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, env_1.env.jwtRefreshSecret, { expiresIn: '30d' });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtRefreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
const generateTokenPair = (userId) => ({
    accessToken: (0, exports.generateAccessToken)(userId),
    refreshToken: (0, exports.generateRefreshToken)(userId),
});
exports.generateTokenPair = generateTokenPair;
//# sourceMappingURL=jwt.js.map