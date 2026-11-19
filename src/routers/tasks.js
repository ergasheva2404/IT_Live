import express from "express"
import tasksController from "../controllers/tasks.js"
import authGuard from "../guards/auth.guard.js"
import {roleGuard} from "../guards/role.guard.js"

const router = express.Router()

router
.get("/tasks/:lessonId", authGuard, tasksController.getAllTasks)
.post ("/tasks", authGuard, roleGuard("admin", "teacher"), tasksController.createTask)



export default router