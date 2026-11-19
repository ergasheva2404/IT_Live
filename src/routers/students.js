import express from "express"
import studentsController from "../controllers/students.js"
import authGuard from "../guards/auth.guard.js"
import {roleGuard} from "../guards/role.guard.js"

const router = express.Router()

router
// .get("/exams/:lessonId", authGuard, examsController.getAllExams)
// .post ("/register", studentsController.createStudent)



export default router