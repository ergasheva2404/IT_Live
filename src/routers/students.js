import express from "express"
import studentsController from "../controllers/students.js"
import authGuard from "../guards/auth.guard.js"
import {roleGuard} from "../guards/role.guard.js"

const router = express.Router()

router
// .get("/exams/:lessonId", authGuard, examsController.getAllExams)
/* .post ("/register", studentsController.createStudent) */

.post("/students/courses/buy/:courseId", authGuard, roleGuard("student"), studentsController.buyCourse)
.get("/students/courses", authGuard, roleGuard('student'), studentsController.getMyCourses)



export default router