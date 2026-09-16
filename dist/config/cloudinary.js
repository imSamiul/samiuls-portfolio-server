"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_IMAGE_FOLDER = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("./env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
    secure: true,
});
exports.PROJECT_IMAGE_FOLDER = 'portfolio/projects';
exports.default = cloudinary_1.v2;
