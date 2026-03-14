"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsModule = void 0;
const common_1 = require("@nestjs/common");
const comments_controller_js_1 = require("./comments.controller.js");
const comments_service_js_1 = require("./comments.service.js");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
let CommentsModule = class CommentsModule {
};
exports.CommentsModule = CommentsModule;
exports.CommentsModule = CommentsModule = __decorate([
    (0, common_1.Module)({
        controllers: [comments_controller_js_1.CommentsController],
        providers: [comments_service_js_1.CommentsService, prisma_service_js_1.PrismaService],
        exports: [comments_service_js_1.CommentsService],
    })
], CommentsModule);
//# sourceMappingURL=comments.module.js.map