"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNoContent = exports.sendCreated = exports.sendError = exports.sendPaginated = exports.sendSuccess = void 0;
const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
const sendSuccess = (res, data, status = 200) => {
    res.status(status).json({ success: true, data: serialize(data) });
};
exports.sendSuccess = sendSuccess;
const sendPaginated = (res, data, meta) => {
    res.status(200).json({ success: true, data: serialize(data), meta });
};
exports.sendPaginated = sendPaginated;
const sendError = (res, message, status = 400) => {
    res.status(status).json({ success: false, error: message });
};
exports.sendError = sendError;
const sendCreated = (res, data) => {
    (0, exports.sendSuccess)(res, data, 201);
};
exports.sendCreated = sendCreated;
const sendNoContent = (res) => {
    res.status(204).send();
};
exports.sendNoContent = sendNoContent;
//# sourceMappingURL=response.js.map