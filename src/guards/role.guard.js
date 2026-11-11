import { ForbiddenError, InternalServerError } from "../utils/error.js"

export const roleGuard = (...roles) => {
    return (req, res, next) => {
        try {
            if (!roles.map(r => r.toLowerCase()).includes(req.user.role?.toLowerCase())) {
                return next(new ForbiddenError(403, "You have not enough permissions"))
            }
            return next()

        } catch (error) {
            return next(new InternalServerError(500, error))
        }
    }
}