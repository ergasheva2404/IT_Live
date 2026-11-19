import examsService from "../services/exams.js";

class ExamsController{

     async getAllExams(req,res,next) {
        let resData = await examsService.getAllExams(req,next)

        if(resData){
            return res.status(resData.status).json(resData)
        }
        
    }
    async createExam(req,res,next) {
        let resData = await examsService.createExam(req,next)

        if(resData){
            return res.status(resData.status).json(resData)
        }
    }
}

const examsController = new ExamsController()
export default examsController
