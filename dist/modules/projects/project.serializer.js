"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeProject = serializeProject;
function serializeProject(project) {
    var _a;
    const { _id, image } = project, rest = __rest(project, ["_id", "image"]);
    return Object.assign(Object.assign({}, rest), { _id: _id.toString(), image: (_a = image === null || image === void 0 ? void 0 : image.url) !== null && _a !== void 0 ? _a : '' });
}
