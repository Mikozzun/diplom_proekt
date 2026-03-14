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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
let EmailAuthService = EmailAuthService_1 = class EmailAuthService {
    prisma;
    SALT_ROUNDS = 10;
    logger = new common_1.Logger(EmailAuthService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(email, password, username) {
        this.logger.log(`Register attempt: ${this.maskEmail(email)}`);
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            this.logger.warn(`Register failed (already exists): ${this.maskEmail(email)}`);
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                username,
            },
        });
        this.logger.log(`Register success: user ${user.id} (${this.maskEmail(user.email ?? '')})`);
        return {
            userId: user.id.toString(),
            email: user.email,
            username: user.username,
        };
    }
    async login(email, password) {
        this.logger.log(`Login attempt: ${this.maskEmail(email)}`);
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            this.logger.warn(`Login failed: ${this.maskEmail(email)}`);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            this.logger.warn(`Login failed: ${this.maskEmail(email)}`);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        this.logger.log(`Login success: user ${user.id} (${this.maskEmail(user.email ?? '')})`);
        return {
            userId: user.id.toString(),
            email: user.email,
            username: user.username,
        };
    }
    maskEmail(email) {
        const normalized = email.trim().toLowerCase();
        const [local, domain] = normalized.split('@');
        if (!local || !domain) {
            return '[invalid-email]';
        }
        if (local.length <= 2) {
            return `${local[0] ?? '*'}*@${domain}`;
        }
        return `${local[0]}***${local[local.length - 1]}@${domain}`;
    }
};
exports.EmailAuthService = EmailAuthService;
exports.EmailAuthService = EmailAuthService = EmailAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], EmailAuthService);
//# sourceMappingURL=email-auth.service.js.map