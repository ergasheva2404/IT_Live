import pool from "../config/db.js"
import { ConflictError, ForbiddenError, NotFoundError, InternalServerError } from "../utils/error.js"

class SectionService {

    async getSectionsById(req, next) {
        try {
            const { courseId } = req.params
            const teacherId = req.user.id

            const existCourse = await pool.query("select * from courses where id=$1", [courseId])

            if (!existCourse.rows.length) {
                return next(new NotFoundError(404, "Course not found"))
            }

            if (req.user.role=="teacher" && teacherId != existCourse.rows[0].user_id) {
                return next(new ForbiddenError(403, "You cannot add section to this course"))
            }

            const sections = await pool.query("select * from sections where course_id=$1", [courseId])

            return {
                status:200,
                data:sections.rows
            }
          
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
    async createSection(req, next) {
        try {
            const { name, courseId } = req.body
            const teacherId = req.user.id

            const existCourse = await pool.query("select * from courses where id=$1", [courseId])
            if (!existCourse.rows.length) {
                return next(new NotFoundError(404, "Course not found"))
            }

            if (teacherId != existCourse.rows[0].user_id) {
                return next(new ForbiddenError(403, "You cannot add section to this course"))
            }

            const existSection = await pool.query(
                "select * from sections where name=$1 and course_id=$2",
                [name, courseId]
            )
            if (existSection.rows.length) {
                return next(new ConflictError(409, "Section already exists"))
            }

            await pool.query("insert into sections (name, course_id) values ($1, $2)", [name, courseId])

            return {
                status: 201,
                message: "Section created!"
            }
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
}

const sectionService = new SectionService()
export default sectionService