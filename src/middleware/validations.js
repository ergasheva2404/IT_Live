import { BadRequestErorr, InternalServerError } from "../utils/error.js"
import schema from "../utils/validation.js"

export default {
    createUsers: (req, res, next) => {
        let { error } = schema.usersSchema.validate(req.body)
        if (error) {
            return res.status(400).json({
                status: 400,
                message: error.message
            })
        }

        return next()
    },

    createCourse: (req, res, next) => {
        try {
            let { error } = schema.courseSchema.validate(req.body)
            if (error) {
                return  next (new BadRequestErorr(400, error.message))
            }
            return next()
        } catch (error) {
             next(new InternalServerError(500, error))
        }

    }
}

