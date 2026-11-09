import jwt from "jsonwebtoken"
import { BadRequestErorr, InternalServerError, UnauthorizedError } from "../utils/error.js"

export default (req, res, next) => {
    try {
        const { token } = req.headers

        if (!token) {
            return next(new UnauthorizedError(401, "Unathorized user"))
        }

        const user = jwt.verify(token.process.env.JWT_SECRET)
        req.user = user

        next()

    } catch (error) {
        if (error) {
            return next(new BadRequestErorr(400, "Invalid token"))
        }

        next(new InternalServerError(500, error))
    }
}