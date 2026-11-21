import pool from "../config/db.js"
import { extname, join } from "path"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import { BadRequestErorr, ConflictError, ForbiddenError, NotFoundError, InternalServerError } from "../utils/error.js"

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

        if (!allowedFileType.includes(extname(file.name))) {
            return next(new BadRequestErorr(400, "Invalid file type"))
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
    async updateTask(req, next) {
        try {
            const { taskId } = req.params
            const { description } = req.body
            const userId = req.user.id || req.user.user_id

            const existTask = await pool.query(`select t.*, c.user_id as teacher_id from tasks t inner join lessons l on t.lesson_id = l.id 
                 inner join sections s on l.section_id = s.id
                 inner join courses c on s.course_id = c.id where t.id = $1`,[taskId])

            if (!existTask.rows.length) {
                return next(new NotFoundError(404, "Task not found"))
            }

            const task = existTask.rows[0]

            if (req.user.role.toLowerCase() === "teacher" && task.teacher_id != userId) {
                return next(new ForbiddenError(403, "You cannot update this task"))
            }

            let filename = task.file

            if (req.files && req.files.file) {
                const { file } = req.files
                const allowedFileType = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".jpeg", ".jpg", ".mp4", ".mov"]

                if (!allowedFileType.includes(extname(file.name).toLowerCase())) {
                    return next(new BadRequestErorr(400, "Invalid file type"))
                }

                if (task.file) {
                    const oldFilePath = join(process.cwd(), "src", "uploads", task.file)
                    if (existsSync(oldFilePath)) await unlink(oldFilePath)
                }

                filename = Date.now() + extname(file.name)
                await file.mv(join(process.cwd(), "src", "uploads", filename))
            }

            await pool.query(
                "update tasks set description=$1, file=$2 where id=$3",
                [description || task.description, filename, taskId]
            )

            return {
                status: 200,
                message: "Task successfully updated!"
            }
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
    async deleteTask(req, next) {
        try {
            const { taskId } = req.params
            const userId = req.user.id

            const existTask = await pool.query(`select t.*, c.user_id as teacher_id from tasks t
                 inner join lessons l on t.lesson_id = l.id
                 inner join sections s on l.section_id = s.id
                 inner join courses c on s.course_id = c.id where t.id = $1`,[taskId])

            if (!existTask.rows.length) {
                return next(new NotFoundError(404, "Task not found"))
            }

            const task = existTask.rows[0]

            if (req.user.role.toLowerCase() === "teacher" && task.teacher_id != userId) {
                return next(new ForbiddenError(403, "You cannot delete this task"))
            }

            await pool.query("delete from tasks where id=$1", [taskId])

            if (task.file) {
                const filePath = join(process.cwd(), "src", "uploads", task.file)
                if (existsSync(filePath)) await unlink(filePath)
            }

            return {
                status: 200,
                message: "Task successfully deleted!"
            }
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
}

const tasksService = new TasksService()
export default tasksService