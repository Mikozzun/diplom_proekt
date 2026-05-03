"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthentication = exports.getAuthenticationOptions = exports.verifyRegistration = exports.getRegistrationOptions = void 0;
const server_1 = require("@simplewebauthn/server");
const env_1 = require("../config/env");
const rpID = env_1.env.rpId;
const rpName = env_1.env.rpName;
const origin = env_1.env.rpOrigin;
const getRegistrationOptions = async (userId, username, existingCredentials = []) => {
    return (0, server_1.generateRegistrationOptions)({
        rpName,
        rpID,
        userName: username,
        userID: new TextEncoder().encode(userId),
        attestationType: 'none',
        excludeCredentials: existingCredentials.map((c) => ({
            id: c.credentialId,
            transports: c.transports,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
        },
    });
};
exports.getRegistrationOptions = getRegistrationOptions;
const verifyRegistration = async (response, expectedChallenge) => {
    return (0, server_1.verifyRegistrationResponse)({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
    });
};
exports.verifyRegistration = verifyRegistration;
const getAuthenticationOptions = async (credentials = []) => {
    return (0, server_1.generateAuthenticationOptions)({
        rpID,
        allowCredentials: credentials.map((c) => ({
            id: c.credentialId,
            transports: c.transports,
        })),
        userVerification: 'preferred',
    });
};
exports.getAuthenticationOptions = getAuthenticationOptions;
const verifyAuthentication = async (response, expectedChallenge, credential) => {
    return (0, server_1.verifyAuthenticationResponse)({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
            id: credential.credentialId,
            publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
            counter: credential.counter,
            transports: credential.transports,
        },
    });
};
exports.verifyAuthentication = verifyAuthentication;
//# sourceMappingURL=passkey.js.map