import pool from "../config/db.js"
import argon from "argon2"
import { NotFoundError, ForbiddenError, ConflictError, InternalServerError } from "../utils/error.js";

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
    async updateTeacher(req, next) {
        try {
            const { teacherId } = req.params
            const { id: userId, role } = req.user

            const existTeacher = await pool.query(`select u.*, m.experience, m.job, m.portfolio, m.description, m.telegram, m.instagram, m.facebook, m.github, m.linkedin from users u
             inner join roles r ON u.role_id = r.id left join mentor_profile m ON u.id = m.user_id where u.id = $1 and lower(r.name) = 'teacher'`, [teacherId])

            if (!existTeacher.rows.length) {
                return next(new NotFoundError(404, "Teacher not found"))
            }
            if (role.toLowerCase() === "teacher" && teacherId != userId) {
                return next(new ForbiddenError(403, "You can only update your own profile"))
            }

            const teacher = existTeacher.rows[0]
            const {
                fullname, phone, password,
                experience, job, portfolio, description, decription,
                telegram, instagram, facebook, github, linkedIn, linkedin
            } = req.body

            const hashPassword = password ? await argon.hash(password) : teacher.password;

            await pool.query(
                `UPDATE users SET fullname=$1, phone=$2, password=$3 WHERE id=$4`,
                [
                    fullname || teacher.fullname,
                    phone || teacher.phone,
                    hashPassword,
                    teacherId
                ]
            )
            const existProfile = await pool.query("SELECT * FROM mentor_profile WHERE user_id=$1", [teacherId]);

            const finalDescription = description ?? decription ?? teacher.description;
            const finalLinkedin = linkedIn ?? linkedin ?? teacher.linkedin;

            if (existProfile.rows.length) {
                await pool.query(`update mentor_profile set experience=$1, job=$2, portfolio=$3, description=$4, 
                     telegram=$5, instagram=$6, facebook=$7, github=$8, linkedin=$9
                     where user_id=$10`,
                    [
                        experience ?? teacher.experience,
                        job ?? teacher.job,
                        portfolio ?? teacher.portfolio,
                        finalDescription,
                        telegram ?? teacher.telegram,
                        instagram ?? teacher.instagram,
                        facebook ?? teacher.facebook,
                        github ?? teacher.github,
                        finalLinkedin,
                        teacherId
                    ]
                )
            } else {
                await pool.query(`insert into mentor_profile(user_id, experience, job, portfolio, description, telegram, instagram, facebook, github, linkedin)
                     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        teacherId,
                        experience ?? null,
                        job ?? null,
                        portfolio ?? null,
                        finalDescription ?? null,
                        telegram ?? null,
                        instagram ?? null,
                        facebook ?? null,
                        github ?? null,
                        finalLinkedin ?? null
                    ]
                )
            }

            return {
                status: 200,
                message: "Teacher successfully updated!"
            }

        } catch (error) {
            if (error.code === "23505") {
                return next(new ConflictError(409, "Bu telefon raqami allaqachon ro'yxatdan o'tgan"))
            }
            return next(new InternalServerError(500, error.message))
        }
    }
    async deleteTeacher(req, next) {
        try {
            const { teacherId } = req.params;

            const existTeacher = await pool.query(
                `SELECT u.id FROM users u 
                 INNER JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = $1 AND lower(r.name) = 'teacher'`,
                [teacherId]
            );

            if (!existTeacher.rows.length) {
                return next(new NotFoundError(404, "Teacher not found"));
            }

            // Avval mentor_profile dagi bog'liq ma'lumotni o'chiramiz
            await pool.query("DELETE FROM mentor_profile WHERE user_id=$1", [teacherId]);

            // Keyin users jadvalidan o'chiramiz
            await pool.query("DELETE FROM users WHERE id=$1", [teacherId]);

            return {
                status: 200,
                message: "Teacher deleted successfully!"
            };

        } catch (error) {
            // Agar teacherning kurslari (courses) mavjud bo'lsa
            if (error.code === "23503") {
                return next(new ConflictError(409, "Bu o'qituvchiga tegishli kurslar mavjud, avval ularni o'chiring"));
            }
            return next(new InternalServerError(500, error.message));
        }
    }


}

const teacherService = new TeacherService()

export default teacherService