"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCanReadPost = assertCanReadPost;
const common_1 = require("@nestjs/common");
function assertCanReadPost(viewer, post) {
    if (post.status === 'published')
        return;
    if (!viewer)
        throw new common_1.ForbiddenException('Forbidden');
    if (viewer.role === 'admin')
        return;
    if (post.authorId === viewer.id)
        return;
    throw new common_1.ForbiddenException('Forbidden');
}
//# sourceMappingURL=assert-can-read-post.js.map