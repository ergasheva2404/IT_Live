import pool from "../config/db.js"
import { extname, join } from "path"
import fs from "fs"
import { BadRequestErorr, ConflictError, ForbiddenError, NotFoundError, InternalServerError } from "../utils/error.js"

class LessonsService {

    async getAllLessons(req, next) {
        const { sectionId } = req.params
        const userId = req.user.id
        const role = req.user.role.toLowerCase()

        const existSection = await pool.query("select c.user_id, c.id as course_id from sections s inner join courses c on s.course_id=c.id where s.id=$1", [sectionId])
        if (!existSection.rows.length) {
            next(new NotFoundError(404, "Section not found"))
        }

        let sectionTeacherId = existSection.rows[0].user_id
        if (req.user.role == "teacher" && userId != sectionTeacherId) {
            return next(new ForbiddenError(403, "You cannot get lessons of this section"))
        }

        if (role === "student") {
            const payments = await pool.query("select * from payments where student_id=$1 and course_id=$2", [userId, existSection.rows[0].course_id])
            if (!payments.rows.length) {
                return next(new ForbiddenError(403, "You cannot get lessons of this course"))
            }
        }

        const lessons = await pool.query("select * from lessons where section_id=$1", [sectionId])

        if (!lessons.rows.length) {
            return next(new NotFoundError(404, "Lesson not found"))
        }
        return {
            status: 200,
            data: lessons.rows
        }
    }
    async createLessons(req, next) {
        const { name, description, section_id } = req.body
        const { file } = req.files

        const filename = Date.now() + extname(file.name)

        const existSection = await pool.query("select c.user_id from sections s inner join courses c on s.course_id = c.id where s.id=$1", [section_id])

        if (!existSection.rows.length) {
            next(new NotFoundError(404, "Section not found"))
        }

        let teacherId = existSection.rows[0].user_id

        if (req.user.role == "teacher" && teacherId != req.user_id) {
            return next(new ForbiddenError(403, "You cannot add lesson to this section"))
        }
        const existLesson = await pool.query("select * from lessons where name=$1 and section_id=$2", [name, section_id])

        if (existLesson.rows.length) {
            next(new ConflictError(409, "Lesson already exists in this section with this name"))
        }

        const allowedFileType = [".mp4", ".mov", ".avi", ".wmv", ".flv", ".mkv"]

        if (!allowedFileType.includes(extname(file.name))) {
            return next(new BadRequestErorr(400, "Invalid file type"))
        }

        await pool.query(`insert into lessons(name, description, section_id, file) values ($1,$2,$3,$4)`, [name, description, section_id, filename])

        file.mv(join(process.cwd(), "src", "uploads", filename), err => {
            if (err) {
                console.log(err)
            }
        })
        return {
            status: 201,
            message: "Lesson created!"
        }
    }
    async updateLesson(req, next) {
        const { lessonId } = req.params
        const { name, description } = req.body
        const file = req.files?.file

        const existLesson = await pool.query("select l.*, c.user_id as owner_id from lessons l inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where l.id=$1", [lessonId])
        if (!existLesson.rows.length) {
            return next(new NotFoundError(404, "Lesson not found"))
        }

        if (req.user.role.toLowerCase() == "teacher" && req.user.id != existLesson.rows[0].owner_id) {
            return next(new ForbiddenError(403, "You cannot update this lesson"))
        }

        if (name) {
            const existName = await pool.query("select * from lessons where name=$1 and section_id=$2 and id<>$3", [name, existLesson.rows[0].section_id, lessonId])
            if (existName.rows.length) {
                return next(new ConflictError(409, "Lesson already exists in this section with this name"))
            }
        }

        let filename = null

        if (file) {
            const allowedFileType = [".mp4", ".mov", ".avi", ".wmv", ".flv", ".mkv"]

            if (!allowedFileType.includes(extname(file.name).toLowerCase())) {
                return next(new BadRequestErorr(400, "Invalid file type"))
            }

            filename = Date.now() + extname(file.name)
        }

        await pool.query("update lessons set name=coalesce($1, name), description=coalesce($2, description), file=coalesce($3, file) where id=$4", [name ?? null, description ?? null, filename, lessonId])

        if (file) {
            file.mv(join(process.cwd(), "src", "uploads", filename), err => {
                if (err) {
                    console.log(err)
                }
            })

            // eski videoni o'chirish
            fs.unlink(join(process.cwd(), "src", "uploads", existLesson.rows[0].file), err => {
                if (err) {
                    console.log(err)
                }
            })
        }

        return {
            status: 200,
            message: "Lesson updated!"
        }
    }
    async deleteLesson(req, next) {
        try {
            const { lessonId } = req.params

            const existLesson = await pool.query("select l.*, c.user_id as owner_id from lessons l inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where l.id=$1", [lessonId])
            if (!existLesson.rows.length) {
                return next(new NotFoundError(404, "Lesson not found"))
            }

            if (req.user.role.toLowerCase() == "teacher" && req.user.id != existLesson.rows[0].owner_id) {
                return next(new ForbiddenError(403, "You cannot delete this lesson"))
            }

            await pool.query("delete from lessons where id=$1", [lessonId])

            fs.unlink(join(process.cwd(), "src", "uploads", existLesson.rows[0].file), err => {
                if (err) {
                    console.log(err)
                }
            })

            return {
                status: 200,
                message: "Lesson deleted!"
            }
        } catch (error) {
            if (error.code === "23503") {
                return next(new ConflictError(409, "Cannot delete lesson: it has materials, tasks or exams"))
            }
            return next(new InternalServerError(500, error.message))
        }
    }

}

const lessonsService = new LessonsService()
export default lessonsService