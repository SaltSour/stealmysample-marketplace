"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var email, user, hashedPassword, existingCreator, creator, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    email = process.argv[2];
                    if (!email) {
                        console.error('Please provide an email address');
                        process.exit(1);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 12, 13, 15]);
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: email }
                        })];
                case 2:
                    user = _a.sent();
                    if (!!user) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, bcryptjs_1.hash)('password123', 12)];
                case 3:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: email,
                                password: hashedPassword,
                                name: email.split('@')[0], // Use part of email as name
                                role: client_1.UserRole.CREATOR,
                                isCreator: true,
                            }
                        })];
                case 4:
                    user = _a.sent();
                    console.log('Created new user:', user.email);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, prisma.user.update({
                        where: { email: email },
                        data: {
                            role: client_1.UserRole.CREATOR,
                            isCreator: true,
                        }
                    })];
                case 6:
                    // Update existing user to be a creator
                    user = _a.sent();
                    console.log('Updated existing user:', user.email);
                    _a.label = 7;
                case 7: return [4 /*yield*/, prisma.creator.findUnique({
                        where: { userId: user.id }
                    })];
                case 8:
                    existingCreator = _a.sent();
                    if (!!existingCreator) return [3 /*break*/, 10];
                    return [4 /*yield*/, prisma.creator.create({
                            data: {
                                userId: user.id,
                                bio: 'New Creator',
                                isVerified: true, // Set to true by default
                                payoutEnabled: true, // Set to true by default
                            }
                        })];
                case 9:
                    creator = _a.sent();
                    console.log('Created creator profile:', creator.id);
                    return [3 /*break*/, 11];
                case 10:
                    console.log('Creator profile already exists:', existingCreator.id);
                    _a.label = 11;
                case 11:
                    console.log('Successfully set up creator access!');
                    return [3 /*break*/, 15];
                case 12:
                    error_1 = _a.sent();
                    console.error('Error:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 15];
                case 13: return [4 /*yield*/, prisma.$disconnect()];
                case 14:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
main();
