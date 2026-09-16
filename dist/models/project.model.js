"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const projectSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    summary: {
        type: String,
        required: true,
        trim: true,
    },
    frontEndTech: {
        type: [String],
        required: true,
    },
    backEndTech: {
        type: [String],
        required: true,
    },
    liveLink: {
        type: String,
        required: true,
    },
    frontEndRepo: {
        type: String,
        required: true,
    },
    backEndRepo: {
        type: String,
        required: true,
    },
    projectDetails: {
        type: String,
        required: true,
    },
    showOnHomepage: {
        type: Boolean,
        default: false,
    },
    image: {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
    },
}, {
    timestamps: true,
});
// The homepage filters on this flag on every render.
projectSchema.index({ showOnHomepage: 1 });
const Project = (0, mongoose_1.model)('Project', projectSchema);
exports.default = Project;
