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
        if (!exams.rows.length) {
            return next(new NotFoundError(404, "Exam has not created yet, for this lesson"))
        }
        return {
            status: 200,
            data: exams.rows
        }
    }
    async createExam(req, next) {
        const { lesson_id, question, variantA, variantB, variantC, variantD, answer } = req.body


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
    async updateExam(req, next) {
        const { examId } = req.params
        const { question, variantA, variantB, variantC, variantD, answer } = req.body

        const existExam = await pool.query("select e.*, c.user_id as owner_id from exams e inner join lessons l on e.lesson_id = l.id inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where e.id=$1", [examId])
        if (!existExam.rows.length) {
            return next(new NotFoundError(404, "Exam not found"))
        }

        if (req.user.role.toLowerCase() == "teacher" && req.user.id != existExam.rows[0].owner_id) {
            return next(new ForbiddenError(403, "You cannot update this exam"))
        }

        const existsQuestion = await pool.query("select * from exams where question=$1 and lesson_id=$2 and id<>$3", [question, existExam.rows[0].lesson_id, examId])
        if (existsQuestion.rows.length) {
            return next(new ConflictError(409, "This question already exists on this exam"))
        }

        await pool.query(`update exams set question=coalesce($1, question), variantA=coalesce($2, variantA), variantB=coalesce($3, variantB), variantC=coalesce($4, variantC), variantD=coalesce($5, variantD), answer=coalesce($6, answer) where id=$7`, [question ?? null, variantA ?? null, variantB ?? null, variantC ?? null, variantD ?? null, answer ?? null, examId])

        return {
            status: 200,
            message: "Exam updated!"
        }
    }
    async deleteExam(req, next) {
        const { examId } = req.params

        const existExam = await pool.query("select e.*, c.user_id as owner_id from exams e inner join lessons l on e.lesson_id = l.id inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where e.id=$1", [examId])
        if (!existExam.rows.length) {
            return next(new NotFoundError(404, "Exam not found"))
        }

        if (req.user.role.toLowerCase() == "teacher" && req.user.id != existExam.rows[0].owner_id) {
            return next(new ForbiddenError(403, "You cannot delete this exam"))
        }

        await pool.query("delete from exams where id=$1", [examId])

        return {
            status: 200,
            message: "Exam deleted!"
        }
    }

}

const examsService = new ExamsService()
export default examsService