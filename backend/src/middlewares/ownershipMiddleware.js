import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

/**
 * Ensures that the authenticated user owns the resource or is an ADMIN.
 */
export function checkOwnership(fetchResourceFn, paramName = 'id') {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await fetchResourceFn(resourceId);

      if (!resource) {
        return next(ApiError.notFound('Resource not found'));
      }

      const resourceOwnerId = resource.userId ? resource.userId.toString() : null;
      const currentUserId = req.user.id.toString();

      if (req.user.role !== ROLES.ADMIN && resourceOwnerId !== currentUserId) {
        return next(ApiError.forbidden('You do not have permission to access or modify this resource'));
      }

      req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
}
