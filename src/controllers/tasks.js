import tasksService from "../services/tasks.js"

class TasksController {

    async getAllTasks(req, res, next) {
        let resData = await tasksService.getAllTasks(req, next)

        if (resData) {
            return res.status(resData.status).json(resData)
        }

    }
    async createTask(req, res, next) {
        let resData = await tasksService.createTask(req, next)

        if (resData) {
            return res.status(resData.status).json(resData)
        }
    }
    async updateTask(req, res, next) {
        const resData = await tasksService.updateTask(req, next)
        if (resData) {
            return res.status(resData.status).json(resData)
        }
    }
    async deleteTask(req, res, next) {
        const resData = await tasksService.deleteTask(req, next)
        if (resData) {
            return res.status(resData.status).json(resData)
        }
    }
}

const tasksController = new TasksController()
export default tasksController
