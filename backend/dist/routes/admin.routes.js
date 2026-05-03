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
exports.adminRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const adminController = __importStar(require("../controllers/admin.controller"));
const moderationController = __importStar(require("../controllers/moderation.controller"));
const reportController = __importStar(require("../controllers/report.controller"));
const router = (0, express_1.Router)();
exports.adminRoutes = router;
router.use(auth_1.authenticate, auth_1.requireAdmin);
router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/role', (0, validate_1.validate)(zod_1.z.object({ role: zod_1.z.string() })), adminController.assignRole);
router.delete('/users/:userId/role', (0, validate_1.validate)(zod_1.z.object({ role: zod_1.z.string() })), adminController.removeRole);
router.post('/users/:userId/promote', adminController.promoteToAdmin);
router.post('/users/:userId/ban', adminController.banUser);
router.get('/moderation', moderationController.getQueue);
router.put('/moderation/:id', (0, validate_1.validate)(zod_1.z.object({ action: zod_1.z.enum(['approve', 'reject']) })), moderationController.resolveItem);
router.get('/reports', reportController.getReports);
router.get('/metrics', adminController.getMetrics);
//# sourceMappingURL=admin.routes.js.map