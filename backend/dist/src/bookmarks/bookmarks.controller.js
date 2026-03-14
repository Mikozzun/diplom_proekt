"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarksController = void 0;
const common_1 = require("@nestjs/common");
const bookmarks_service_js_1 = require("./bookmarks.service.js");
const session_guard_js_1 = require("../auth/guards/session.guard.js");
let BookmarksController = class BookmarksController {
    bookmarksService;
    constructor(bookmarksService) {
        this.bookmarksService = bookmarksService;
    }
    toggle(postId, req) {
        return this.bookmarksService.toggle(postId, req.session.userId);
    }
    remove(postId, req) {
        return this.bookmarksService.remove(postId, req.session.userId);
    }
    findMyBookmarks(req, cursor, limit) {
        return this.bookmarksService.findByUser(req.session.userId, {
            cursor,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
};
exports.BookmarksController = BookmarksController;
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Post)('posts/:postId/bookmark'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookmarksController.prototype, "toggle", null);
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Delete)('posts/:postId/bookmark'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookmarksController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Get)('bookmarks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BookmarksController.prototype, "findMyBookmarks", null);
exports.BookmarksController = BookmarksController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [bookmarks_service_js_1.BookmarksService])
], BookmarksController);
//# sourceMappingURL=bookmarks.controller.js.map