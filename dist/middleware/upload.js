"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProjectImage = uploadProjectImage;
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
// Kept in memory because the buffer goes straight to Cloudinary — nothing is
// written to the container's filesystem.
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new ApiError_1.default(400, 'Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
    },
}).single('image');
function uploadProjectImage(req, res, next) {
    upload(req, res, (error) => {
        if (error instanceof multer_1.default.MulterError) {
            next(new ApiError_1.default(400, error.code === 'LIMIT_FILE_SIZE'
                ? 'File size is too large. Max size is 2MB.'
                : `Upload error: ${error.message}`));
            return;
        }
        next(error);
    });
}
