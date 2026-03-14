"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const app_controller_js_1 = require("./app.controller.js");
const app_service_js_1 = require("./app.service.js");
const auth_module_js_1 = require("./auth/auth.module.js");
const users_module_js_1 = require("./users/users.module.js");
const posts_module_js_1 = require("./posts/posts.module.js");
const comments_module_js_1 = require("./comments/comments.module.js");
const likes_module_js_1 = require("./likes/likes.module.js");
const bookmarks_module_js_1 = require("./bookmarks/bookmarks.module.js");
const reactions_module_js_1 = require("./reactions/reactions.module.js");
const logs_module_js_1 = require("./logs/logs.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'public', 'test'),
                serveRoot: '/test',
            }),
            auth_module_js_1.AuthModule,
            users_module_js_1.UsersModule,
            posts_module_js_1.PostsModule,
            comments_module_js_1.CommentsModule,
            likes_module_js_1.LikesModule,
            bookmarks_module_js_1.BookmarksModule,
            reactions_module_js_1.ReactionsModule,
            logs_module_js_1.LogsModule,
        ],
        controllers: [app_controller_js_1.AppController],
        providers: [app_service_js_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map