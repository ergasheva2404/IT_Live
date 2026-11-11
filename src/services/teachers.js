import pool from "../config/db.js";

class TeacherService {

    async getAllTeachers() {
    const teachers = await pool.query(`SELECT u.id, u.fullname, u.phone, m.job, r.name AS role 
     FROM users u 
     INNER JOIN roles r ON u.role_id = r.id 
     LEFT JOIN mentor_profile m ON u.id = m.user_id
     WHERE lower(r.name) = 'teacher'`
    )

    return {
        status: 200,
        data: teachers.rows
    }
}
}

const teacherService = new TeacherService()

export default teacherService