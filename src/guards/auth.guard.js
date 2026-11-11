import jwt from "jsonwebtoken"
import { BadRequestErorr } from "../utils/error.js"

export default (req, res, next) => {
    try {
        const { token } = req.headers

        if (!token) {
            return next(new UnauthorizedError(401, "Unauthorized user"))
        }

        req.user = jwt.verify(token, process.env.JWT_SECRET)
        return next()


    } catch (error) {
        if (error.name == "JsonWebTokenError") {
            return next(new BadRequestErorr(400, "Invalid or expired token"))
        }

        if (error.name == "TokenExpiredError"){
          return next(new BadRequestErorr(400, error.message))
        }

    }
}