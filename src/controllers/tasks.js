import TasksService from "../services/tasks.js";

class TasksController{

     async getAllTasks(req,res,next) {
        let resData = await TasksService.getAllTasks(req,next)

        if(resData){
            return res.status(resData.status).json(resData)
        }
        
    } 
    async createTask(req,res,next) {
        let resData = await TasksService.createTask(req,next)

        if(resData){
            return res.status(resData.status).json(resData)
        }
    }
}

const tasksController = new TasksController()
export default tasksController
