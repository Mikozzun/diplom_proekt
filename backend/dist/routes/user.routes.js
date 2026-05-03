"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const userController = __importStar(require("../controllers/user.controller"));
const router = (0, express_1.Router)();
exports.userRoutes = router;
const updateSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(30).optional(),
    profileImage: zod_1.z.string().url().optional(),
});
const settingsSchema = zod_1.z.object({
    theme: zod_1.z.enum(['light', 'dark']).optional(),
    notificationsEnabled: zod_1.z.boolean().optional(),
});
router.get('/me', auth_1.authenticate, userController.getMe);
router.put('/me', auth_1.authenticate, (0, validate_1.validate)(updateSchema), userController.updateMe);
router.delete('/me', auth_1.authenticate, userController.deleteAccount);
router.get('/me/settings', auth_1.authenticate, userController.getSettings);
router.put('/me/settings', auth_1.authenticate, (0, validate_1.validate)(settingsSchema), userController.updateSettings);
router.get('/me/sessions', auth_1.authenticate, userController.getMySessions);
router.delete('/me/sessions/:sessionId', auth_1.authenticate, userController.revokeSession);
router.get('/:id', userController.getUserProfile);
//# sourceMappingURL=user.routes.js.map