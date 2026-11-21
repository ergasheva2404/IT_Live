import pool from "../config/db.js"
import { ConflictError, ForbiddenError, NotFoundError, InternalServerError } from "../utils/error.js"

class SectionService {

    async getSectionsById(req, next) {
        console.log("SHU YERGA KELDI:", req.user, req.params)
        try {
            const { courseId } = req.params
            const userId = req.user.id

            const existCourse = await pool.query("select * from courses where id=$1", [courseId])

            if (!existCourse.rows.length) {
                return next(new NotFoundError(404, "Course not found"))
            }

            if (req.user.role == "teacher" && userId != existCourse.rows[0].user_id) {
                return next(new ForbiddenError(403, "You cannot add section to this course"))
            }
            if (req.user.role.toLowerCase() === "student") {
                const payments = await pool.query("select * from payments where student_id=$1 and course_id=$2", [userId, courseId])
                if (!payments.rows.length) {
                    return next(new ForbiddenError(403, "You cannot get sections of this course"))
                }
            }

            const sections = await pool.query("select * from sections where course_id=$1", [courseId])

            return {
                status: 200,
                data: sections.rows
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

            if (req.user.role == "teacher" && teacherId != existCourse.rows[0].user_id) {
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
    async updateSection(req, next) {
        try {
            const { sectionId } = req.params
            const { name } = req.body
            const { id: userId, role } = req.user

            const existSection = await pool.query(`select s.*, c.user_id as teacher_id from sections s join courses c on s.course_id = c.id where s.id = $1`,[sectionId])

            if (!existSection.rows.length) {
                return next(new NotFoundError(404, "Section not found"))
            }

            const section = existSection.rows[0]

            if (role.toLowerCase() === "teacher" && section.teacher_id != userId) {
                return next(new ForbiddenError(403, "You cannot update this section"))
            }
            if (name) {
                const duplicateSection = await pool.query(
                    "select * from sections where name=$1 and course_id=$2 and id!=$3",
                    [name, section.course_id, sectionId]
                )
                if (duplicateSection.rows.length) {
                    return next(new ConflictError(409, "Section with this name already exists in this course"))
                }
            }

            await pool.query(
                "update sections set name=$1 where id=$2",
                [name || section.name, sectionId]
            )

            return {
                status: 200,
                message: "Section updated successfully!"
            }
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
    async deleteSection(req, next) {
        try {
            const { sectionId } = req.params
            const { id: userId, role } = req.user

            const existSection = await pool.query(`select s.*, c.user_id as teacher_id from sections s join courses c on s.course_id = c.id where s.id = $1`,[sectionId])

            if (!existSection.rows.length) {
                return next(new NotFoundError(404, "Section not found"))
            }

            const section = existSection.rows[0]

            if (role.toLowerCase() === "teacher" && section.teacher_id != userId) {
                return next(new ForbiddenError(403, "You cannot delete this section"))
            }

            await pool.query("delete from sections where id=$1", [sectionId])

            return {
                status: 200,
                message: "Section deleted successfully!"
            }
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }

}

const sectionService = new SectionService()
export default sectionService