import jwt from "jsonwebtoken"
import { UnauthorizedError } from "../utils/error.js"

export default (req, res, next) => {
    try {
        const { token } = req.headers

        if (!token) {
            return next(new UnauthorizedError(401, "Unauthorized user"))
        }

        req.user = jwt.verify(token, process.env.JWT_SECRET)
        return next()

    } catch (error) {
        console.log(error.message)
        return next(new UnauthorizedError(401, "Invalid or expired token"))
    }
}