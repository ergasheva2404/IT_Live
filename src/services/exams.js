import pool from "../config/db.js"
import { extname, join } from "path"
import { BadRequestErorr, ConflictError, ForbiddenError, NotFoundError } from "../utils/error.js"

class ExamsService {

 async getAllExams(req, next) {
        const { lessonId } = req.params
        const teacherId = req.user.user_id

        const existLesson = await pool.query("select c.user_id from lessons l inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where l.id=$1", [lessonId])
        if (!existLesson.rows.length) {
            next(new NotFoundError(404, "Lesson not found"))
        }

        let lessonTeacherId = existLesson.rows[0].user_id
        if (req.user.role == "teacher" && teacherId != lessonTeacherId) {
            return next(new ForbiddenError(403, "You cannot get exams of this lesson"))
        }

        const exams = await pool.query("select * from exams where lesson_id=$1", [lessonId])
        return {
            status: 200,
            data: exams.rows
        }
    } 
    async createExam(req, next) {
        const { lesson_id, question, variantA, variantB, variantC, variantD, answer} = req.body


        const existsLesson = await pool.query("select c.user_id from lessons l inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where l.id=$1", [lesson_id])

        if (!existsLesson.rows.length) {
            next(new NotFoundError(404, "Lesson not found"))
        }

        let teacherId = existsLesson.rows[0].user_id

        if (req.user.role == "teacher" && teacherId != req.user_id) {
            return next(new ForbiddenError(403, "You cannot add task to this lesson"))
        }
        const existsExam = await pool.query("select * from exams where question=$1 and lesson_id=$2", [question, lesson_id])
        if (existsExam.rows.length) {
            next(new ConflictError(409, "This question already exists on this exam"))
        }


        await pool.query(`insert into exams (lesson_id, question, variantA, variantB, variantC, variantD, answer) values ($1, $2, $3, $4, $5, $6, $7)`, [lesson_id, question, variantA, variantB, variantC, variantD, answer])

        return {
            status: 201,
            message: "Exam created!"
        }
    }

}

const examsService = new ExamsService()
export default examsService