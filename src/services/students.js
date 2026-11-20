import pool from "../config/db.js"
import { ForbiddenError, InternalServerError, NotFoundError } from "../utils/error.js"

export class StudentsService {

    async getMyCourses(req, next) {
        try {
            let studentId = req.user.id
            let courses = await pool.query(`select c.id, c.name, c.banner, u.photo, u.fullname from payments p join courses c on p.course_id = c.id join users u on c.user_id = u.id where p.student_id=$1`, [studentId])

            courses = courses.rows.map(course => {
                return {
                    id: course.id,
                    course_name: course.name,
                    banner: course.banner,
                    teacher: {
                        fullname: course.fullname,
                        photo: course.photo
                    }

                }
            })

            return {
                status:200,
                data: courses
            }

        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }


    }

    async buyCourse(req, next) {
        const studentId = req.user.id
        const { courseId } = req.params

        const existCourse = await pool.query("select * from courses where id=$1", [courseId])

        if (!existCourse.rows.length) {
            return next(new NotFoundError(404, "Course not found"))
        }
        if (!existCourse.rows[0].approved) {
            return next(new ForbiddenError(403, "You cannot buy this course!"))
        }

        await pool.query("insert into payments(student_id, course_id) values ($1, $2)", [studentId, courseId])

        return {
            status: 201,
            message: "Course bought!"
        }
    }
}

const studentsService = new StudentsService()
export default studentsService