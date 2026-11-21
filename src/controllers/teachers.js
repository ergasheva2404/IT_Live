import teacherService from "../services/teachers.js"

class TeacherController {

   async getAllTeachers(req, res) {
      let resData = await teacherService.getAllTeachers()

      if (resData) {
         return res.status(resData.status).json(resData)
      }
   }

   async updateTeacher(req, res, next) {
      const resData = await teacherService.updateTeacher(req, next);
      if (resData) {
         return res.status(resData.status).json(resData);
      }
   }

   async deleteTeacher(req, res, next) {
      const resData = await teacherService.deleteTeacher(req, next);
      if (resData) {
         return res.status(resData.status).json(resData);
      }
   }
}

const teacherController = new TeacherController()

export default teacherController
