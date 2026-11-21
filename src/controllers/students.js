import studentsService from "../services/students.js";

class StudentController {

    async getMyCourses(req, res, next) {
        let resData = await studentsService.getMyCourses(req, next)
        if (resData) {
            return res.status(resData.status).json(resData)
        }
    }
    async buyCourse(req, res, next) {
        let resData = await studentsService.buyCourse(req, next)
        if (resData) {
            return res.status(resData.status).json(resData)
        }
    }

}

const studentController = new StudentController()
export default studentController