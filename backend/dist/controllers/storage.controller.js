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
exports.deleteFile = exports.getMyFiles = exports.uploadFile = void 0;
const storageService = __importStar(require("../services/storage.service"));
const response_1 = require("../utils/response");
const uploadFile = async (req, res, next) => {
    try {
        const entry = await storageService.createStorageEntry(req.userId, {
            fileName: req.body.fileName,
            fileType: req.body.fileType,
            fileSize: BigInt(req.body.fileSize),
            fileUrl: req.body.fileUrl,
        });
        (0, response_1.sendCreated)(res, entry);
    }
    catch (err) {
        next(err);
    }
};
exports.uploadFile = uploadFile;
const getMyFiles = async (req, res, next) => {
    try {
        const files = await storageService.getUserFiles(req.userId);
        (0, response_1.sendSuccess)(res, files);
    }
    catch (err) {
        next(err);
    }
};
exports.getMyFiles = getMyFiles;
const deleteFile = async (req, res, next) => {
    try {
        await storageService.deleteFile(BigInt(req.params.id), req.userId);
        (0, response_1.sendNoContent)(res);
    }
    catch (err) {
        if (err.message === 'Not authorized') {
            (0, response_1.sendError)(res, err.message, 403);
        }
        else {
            next(err);
        }
    }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=storage.controller.js.map