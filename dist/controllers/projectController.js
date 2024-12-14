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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjects = getProjects;
exports.getProjectById = getProjectById;
exports.getProjectsForHomepage = getProjectsForHomepage;
exports.uploadMiddleware = uploadMiddleware;
exports.createProject = createProject;
exports.updateShowOnHomePage = updateShowOnHomePage;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
const project_model_1 = __importDefault(require("../models/project.model"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
// GET: get all projects
function getProjects(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const projects = yield project_model_1.default.find();
            // convert image buffer to base64 for each project
            const projectWithBase64Image = projects.map((project) => {
                if (project.image && project.image.data) {
                    const base64Image = `data:${project.image.contentType};base64,${project.image.data.toString('base64')}`;
                    project.image = base64Image;
                }
                return project.toObject();
            });
            res.status(200).json(projectWithBase64Image);
        }
        catch (error) {
            let errorMessage = 'Failed to fetch projects';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
            console.log(error);
        }
    });
}
// GET: get project by id
function getProjectById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const project = yield project_model_1.default.findById(id);
            if (!project) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }
            // Convert image buffer to base64 if it exists
            const projectObject = project.toObject();
            if (projectObject.image && projectObject.image.data) {
                projectObject.image = `data:${projectObject.image.contentType};base64,${projectObject.image.data.toString('base64')}`;
            }
            res.status(200).json(projectObject);
        }
        catch (error) {
            let errorMessage = 'Failed to fetch project';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
            console.log(error);
        }
    });
}
// GET: get projects to show on homepage
function getProjectsForHomepage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const projects = yield project_model_1.default.find({ showOnHomepage: true });
            // convert image buffer to base64 for each project
            const projectWithBase64Image = projects.map((project) => {
                if (project.image && project.image.data) {
                    const base64Image = `data:${project.image.contentType};base64,${project.image.data.toString('base64')}`;
                    project.image = base64Image;
                }
                return project.toObject();
            });
            res.status(200).json(projectWithBase64Image);
        }
        catch (error) {
            let errorMessage = 'Failed to fetch projects';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
            console.log(error);
        }
    });
}
// POST: Configure multer to use memory storage
// Middleware to handle single image upload
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true); // Accept file
        }
        else {
            // Explicitly cast error to Multer-compatible type
            cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'), false);
        }
    },
}).single('image');
// Middleware to handle single image upload
function uploadMiddleware(req, res, next) {
    upload(req, res, (error) => {
        if (error instanceof multer_1.default.MulterError) {
            // Multer-specific errors
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res
                    .status(400)
                    .json({ message: 'File size is too large. Max size is 2MB.' });
            }
            return res
                .status(400)
                .json({ message: `Multer error: ${error.message}` });
        }
        else if (error) {
            // Custom file type errors or other unexpected errors
            return res.status(400).json({ message: error.message });
        }
        next();
    });
}
// POST: Create a new project
function createProject(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { title, summary, frontEndTech, backEndTech, liveLink, frontEndRepo, backEndRepo, projectDetails, showOnHomepage, } = req.body;
            // Ensure file is present and store as buffer
            if (!req.file) {
                res.status(400).json({ message: 'Image is required' });
                return;
            }
            // Resize image using sharp
            const resizedImageBuffer = yield (0, sharp_1.default)(req.file.buffer)
                .resize(1920, 1080) // Resize to 800x600 (width x height)
                .toBuffer(); // Convert to buffer for storage
            const newProject = new project_model_1.default({
                title,
                summary,
                frontEndTech: JSON.parse(frontEndTech), // Parse if array is sent as a string
                backEndTech: JSON.parse(backEndTech), // Parse if array is sent as a string
                liveLink,
                frontEndRepo,
                backEndRepo,
                projectDetails,
                showOnHomepage: showOnHomepage === 'true', // Convert string to boolean
                image: {
                    data: resizedImageBuffer, // Store the buffer here
                    contentType: req.file.mimetype, // Store MIME type from multer
                },
            });
            yield newProject.save();
            res
                .status(201)
                .json({ message: 'Project created successfully', project: newProject });
        }
        catch (error) {
            let errorMessage = 'Failed to create project';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
            console.log(error);
        }
    });
}
// PATCH: update project to show project on homepage
function updateShowOnHomePage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const project = yield project_model_1.default.findById(id);
            if (!project) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }
            project.showOnHomepage = !project.showOnHomepage;
            yield project.save();
            res.status(200).json({ message: 'Project updated successfully' });
        }
        catch (error) {
            let errorMessage = 'Failed to update project';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
            console.log(error);
        }
    });
}
// PATCH: update project
function updateProject(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { title, summary, frontEndTech, backEndTech, liveLink, frontEndRepo, backEndRepo, projectDetails, showOnHomepage, } = req.body;
            const project = yield project_model_1.default.findById(id);
            if (!project) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }
            project.title = title;
            project.summary = summary;
            project.frontEndTech = frontEndTech;
            project.backEndTech = backEndTech;
            project.liveLink = liveLink;
            project.frontEndRepo = frontEndRepo;
            project.backEndRepo = backEndRepo;
            project.projectDetails = projectDetails;
            project.showOnHomepage = showOnHomepage;
            yield project.save();
            res.status(200).json({ message: 'Project updated successfully' });
        }
        catch (error) {
            let errorMessage = 'Failed to update project';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
            console.log(error);
        }
    });
}
// DELETE: delete project
function deleteProject(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const deletedProject = yield project_model_1.default.findByIdAndDelete(id);
            if (!deletedProject) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }
            res.status(200).json({ message: 'Project deleted successfully' });
        }
        catch (error) {
            let errorMessage = 'Failed to delete project';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            res.status(500).json({ message: errorMessage });
            console.log(error);
        }
    });
}
