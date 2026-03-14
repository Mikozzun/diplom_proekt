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
exports.ReactionsController = void 0;
const common_1 = require("@nestjs/common");
const reactions_service_js_1 = require("./reactions.service.js");
const session_guard_js_1 = require("../auth/guards/session.guard.js");
const index_js_1 = require("./dto/index.js");
let ReactionsController = class ReactionsController {
    reactionsService;
    constructor(reactionsService) {
        this.reactionsService = reactionsService;
    }
    toggle(postId, req, dto) {
        return this.reactionsService.toggle(postId, req.session.userId, dto);
    }
    remove(postId, req, type) {
        return this.reactionsService.remove(postId, req.session.userId, type);
    }
    findByPost(postId) {
        return this.reactionsService.findByPost(postId);
    }
};
exports.ReactionsController = ReactionsController;
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, index_js_1.CreateReactionDto]),
    __metadata("design:returntype", void 0)
], ReactionsController.prototype, "toggle", null);
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], ReactionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReactionsController.prototype, "findByPost", null);
exports.ReactionsController = ReactionsController = __decorate([
    (0, common_1.Controller)('posts/:postId/reactions'),
    __metadata("design:paramtypes", [reactions_service_js_1.ReactionsService])
], ReactionsController);
//# sourceMappingURL=reactions.controller.js.map