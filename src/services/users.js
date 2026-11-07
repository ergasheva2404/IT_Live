import pool from "../config/db.js"
import argon from "argon2"
import { InternalServerError, NotFoundError } from "../utils/error.js"

class UserServices {

    async getAdmins(next) {
        try {
            const role = await pool.query("select users.id, fullname, phone, photo, users.created_at, users.status, roles.name as role from users inner join roles on roles_id = users.role_id where roles.name='admin'")

            return {
                status: 200,
                data: role.rows
            }
        } catch (error) {
            next(new InternalServerError(500, error))
        }
    }

    async createAdmin(req) {
        try {
            const { fullname, phone, password, role_id } = req.body

            const existUser = await pool.query("select * from users where phone=$1", [phone])
            if (existUser.rows.length) {
                return {
                    status: 409,
                    message: "User allready exists!"
                }
            }

            const existRole = await pool.query("select * from roles where id=$1", [role_id])
            if (!existRole.rows.length) {
                return {
                    status: 404,
                    message: "Role not found with this id!"
                }
            }

            const hashPassword = await argon.hash(password)

            await pool.query(`insert into users (fullname, phone, password, role_id) values ($1, $2, $3, $4)`,
                [fullname, phone, hashPassword, role_id])

            return {
                status: 201,
                message: "User created!"
            }

        } catch (error) {
            next(new InternalServerError(500, error))
        }
    }
    async createTeacher(req, next) {

        try {
             const { fullname, phone, password, role_id, experience, job, portfolio, decription, telegram, instagram, facebook, github, linkedIn } = req.body
        
        const hashPassword = await argon.hash(password)
        const teacher = await pool.query("insert into users(fullname, phone, password, role_id) values ($1, $2, $3, $4) RETURNING *", [fullname, phone, hashPassword, role_id])
        
        await pool.query(
        `insert into mentor_profile(user_id, experience, job, portfolio, description, telegram, instagram, facebook, github, linkedin)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
            teacher.rows[0].id,
            experience ?? null,
            job ?? null,
            portfolio ?? null,
            decription ?? null,
            telegram ?? null,
            instagram ?? null,
            facebook ?? null,
            github ?? null,
            linkedIn ?? null
        ]
    )

        return {
            status: 201,
            message: "Teacher created!"
        }

        } catch (error) {
            next(new InternalServerError(500, error))
        }

    }

    async deleteUser(req, next) {
        try {
            const { userId } = req.params

            const existUser = await pool.query("select * from users where id=$1", [userId])

            if (!existUser.rows.length) {
                next(new NotFoundError(404, "User not foud with this id"))
            }

            await pool.query("delete from users where id=$1", [userId])

            return {
                status: 200,
                message: "User deleted"
            }
        } catch (error) {
            next(new InternalServerError(500, error))
        }
    }
}

const userService = new UserServices()

export default userService
