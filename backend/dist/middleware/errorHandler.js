"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    if (err.name === 'ZodError') {
        res
            .status(422)
            .json({ success: false, error: 'Validation failed', details: err });
        return;
    }
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, error: 'Invalid token' });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, error: 'Token expired' });
        return;
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map