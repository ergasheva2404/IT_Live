import pool from "../config/db.js"
import { extname, join } from "path"
import { BadRequestErorr, ConflictError, ForbiddenError, NotFoundError } from "../utils/error.js"

class TasksService {

 async getAllTasks(req, next) {
        const { lessonId } = req.params
        const teacherId = req.user.user_id

        const existLesson = await pool.query("select c.user_id from lessons l inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where l.id=$1", [lessonId])
        if (!existLesson.rows.length) {
            next(new NotFoundError(404, "Lesson not found"))
        }

        let lessonTeacherId = existLesson.rows[0].user_id
        if (req.user.role == "teacher" && teacherId != lessonTeacherId) {
            return next(new ForbiddenError(403, "You cannot get tasks of this lesson"))
        }

        const tasks = await pool.query("select * from tasks where lesson_id=$1", [lessonId])
        return {
            status: 200,
            data: tasks.rows
        }
    } 
    async createTask(req, next) {
        const { description, lesson_id } = req.body
        const { file } = req.files

        const filename = Date.now() + extname(file.name)

        const existsLesson = await pool.query("select c.user_id from lessons l inner join sections s on l.section_id = s.id inner join courses c on s.course_id = c.id where l.id=$1", [lesson_id])

        if (!existsLesson.rows.length) {
            next(new NotFoundError(404, "Lesson not found"))
        }

        let teacherId = existsLesson.rows[0].user_id

        if (req.user.role == "teacher" && teacherId != req.user_id) {
            return next(new ForbiddenError(403, "You cannot add task to this lesson"))
        }
        const existTasks = await pool.query("select * from tasks where lesson_id=$1", [lesson_id])

        if (existTasks.rows.length) {
            next(new ConflictError(409, "Task already exists for this lesson"))
        }

        const allowedFileType = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".jpeg", ".jpg", ".mp4", ".mov"]

        if(!allowedFileType.includes(extname(file.name))) {
            return next (new BadRequestErorr(400, "Invalid file type"))
        }

        await pool.query(`insert into tasks (description, lesson_id, file) values ($1, $2, $3)`, [description, lesson_id, filename])

        file.mv(join(process.cwd(), "src", "uploads", filename), err => {
            if (err) {
                console.log(err)
            }
        })
        return {
            status: 201,
            message: "Task added!"
        }
    }

}

const tasksService = new TasksService()
export default tasksService