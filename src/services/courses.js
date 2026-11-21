import pool from "../config/db.js"
import { extname, join } from "path"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import { ForbiddenError, InternalServerError, NotFoundError } from "../utils/error.js" 

class CourseService {

    async getCourses(req, next) {
        const courses = await pool.query("select * from courses where approved='true'")
        return {
            status: 200,
            data: courses.rows
        }

    }
    async getAllCourses() {
        const courses = await pool.query("select * from courses")

        return {
            status: 200,
            data: courses.rows
        }
    }
    async getMyCourses (req,next){
        const teacherId = req.user.id
        const courses = await pool.query(`select * from courses where user_id=${teacherId}`)

        return{
            status:200,
            data:courses.rows
        }
    }
    async createCourse(req, next) {
        try {
            const { name, description, level, price, category_id } = req.body
            if (!req.files || !req.files.banner || !req.files.intro_video) {
                return {
                    status: 400,
                    message: "Banner and intro video are required!"
                }
            }

            const { banner, intro_video } = req.files
            const teacherId = req.user.id

            const existCategory = await pool.query("select * from categories where id=$1", [category_id])

            if (!existCategory.rows.length) {

                next(new NotFoundError(404, "Category not found with this id"))
            }


            const filename_banner = Date.now() + extname(banner.name)
            const filename_video = Date.now() + extname(intro_video.name)
            await pool.query(
                `insert into courses(banner, intro_video, name, description, level, price, category_id, user_id) 
                 values ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [filename_banner, filename_video, name, description, level, price, category_id, teacherId]
            )

            banner.mv(join(process.cwd(), "src", "uploads", filename_banner), err => {
                if (err) console.log("Banner move error:", err);
            })

            intro_video.mv(join(process.cwd(), "src", "uploads", filename_video), err => {
                if (err) console.log("Video move error:", err);
            })

            return {
                status: 201,
                message: "Course added!"
            }

        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
    async CourseApprove (req, next) {
          const { courseId } = req.params
       const existCourse = await pool.query("select * from courses where id=$1", [courseId])

       if(!existCourse.rows.length){
        next(new NotFoundError(404, "Course not found"))
       }

       await pool.query(`update courses set approved=${existCourse.rows[0].approved ? false : true} where id=$1`, [courseId])

       return {
        status:200,
        message:"Course's status was changed"
       }
    }
    async updateCourse(req, next) {
        try {
            const { courseId } = req.params
            const { id: userId, role } = req.user

            const existCourse = await pool.query("select * from courses where id=$1", [courseId])
            if (!existCourse.rows.length) {
                return next(new NotFoundError(404, "Course not found"))
            }

            const course = existCourse.rows[0]
            if (role.toLowerCase() === "teacher" && course.user_id != userId) {
                return next(new ForbiddenError(403, "You can only update your own courses"))
            }

            const { name, description, level, price, category_id } = req.body

            if (category_id) {
                const existCategory = await pool.query("select * from categories where id=$1", [category_id])
                if (!existCategory.rows.length) {
                    return next(new NotFoundError(404, "Category not found with this id"))
                }
            }

            let filename_banner = course.banner
            let filename_video = course.intro_video

            if (req.files && req.files.banner) {
                const oldBannerPath = join(process.cwd(), "src", "uploads", course.banner)
                if (existsSync(oldBannerPath)) await unlink(oldBannerPath)

                filename_banner = Date.now() + extname(req.files.banner.name)
                await req.files.banner.mv(join(process.cwd(), "src", "uploads", filename_banner))
            }

            if (req.files && req.files.intro_video) {
                const oldVideoPath = join(process.cwd(), "src", "uploads", course.intro_video)
                if (existsSync(oldVideoPath)) await unlink(oldVideoPath)

                filename_video = (Date.now() + 1) + extname(req.files.intro_video.name)
                await req.files.intro_video.mv(join(process.cwd(), "src", "uploads", filename_video))
            }

            await pool.query(
                `update courses 
                 set name=$1, description=$2, level=$3, price=$4, category_id=$5, banner=$6, intro_video=$7 
                 where id=$8`,
                [
                    name || course.name,
                    description || course.description,
                    level || course.level,
                    price || course.price,
                    category_id || course.category_id,
                    filename_banner,
                    filename_video,
                    courseId
                ]
            )

            return {
                status: 200,
                message: "Course updated successfully!"
            }

        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
    async deleteCourse(req, next) {
        try {
            const { courseId } = req.params
            const { id: userId, role } = req.user

            const existCourse = await pool.query("select * from courses where id=$1", [courseId])
            if (!existCourse.rows.length) {
                return next(new NotFoundError(404, "Course not found"))
            }

            const course = existCourse.rows[0]
            if (role.toLowerCase() === "teacher" && course.user_id != userId) {
                return next(new ForbiddenError(403, "You can only delete your own courses"))
            }

            const bannerPath = join(process.cwd(), "src", "uploads", course.banner)
            const videoPath = join(process.cwd(), "src", "uploads", course.intro_video)
            if (existsSync(bannerPath)) await unlink(bannerPath)
            if (existsSync(videoPath)) await unlink(videoPath)

            await pool.query("delete from courses where id=$1", [courseId])

            return {
                status: 200,
                message: "Course successfully deleted!"
            }

        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
    
}

const courseService = new CourseService()

export default courseService