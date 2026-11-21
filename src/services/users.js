import pool from "../config/db.js"
import argon from "argon2"
import { InternalServerError, NotFoundError } from "../utils/error.js"

class UserServices {

    async getAdmins(next) {
        try {
            const role = await pool.query("select users.id, fullname, phone, photo, users.created_at, users.status, roles.name as role from users inner join roles on roles.id = users.role_id where lower(roles.name) = 'admin'")

            return {
                status: 200,
                data: role.rows
            }
        } catch (error) {
            next(new InternalServerError(500, error))
        }
    }
    async createAdmin(req, next) {
        try {
            const { fullname, phone, password, role_id } = req.body

            const existUser = await pool.query("select * from users where phone=$1", [phone])
            if (existUser.rows.length) {
                return {
                    status: 409,
                    message: "User already exists!"
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
    async updateUser(req, next) {
        try {
            const { userId } = req.params
            const { id: currentUserId, role } = req.user

            const existUser = await pool.query("select * from users where id=$1", [userId])
            if (!existUser.rows.length) {
                return next(new NotFoundError(404, "User not found with this id"))
            }

            if (role.toLowerCase() !== "admin" && userId != currentUserId) {
                return next(new ForbiddenError(403, "You can only update your own profile"))
            }

            const user = existUser.rows[0]
            const { fullname, phone, password, status } = req.body

            if (phone && phone !== user.phone) {
                const existPhone = await pool.query("select * from users where phone=$1 and id!=$2", [phone, userId])
                if (existPhone.rows.length) {
                    return next(new ConflictError(409, "Phone number already in use!"))
                }
            }
            const hashPassword = password ? await argon.hash(password) : user.password

            await pool.query(`update users set fullname=$1, phone=$2, password=$3, status=$4 where id=$5`,
                [
                    fullname || user.fullname,
                    phone || user.phone,
                    hashPassword,
                    status ?? user.status,
                    userId
                ]
            )
            return {
                status: 200,
                message: "User updated successfully!"
            }
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
    async deleteUser(req, next) {
        try {
            const { userId } = req.params

            const existUser = await pool.query("select * from users where id=$1", [userId])
            if (!existUser.rows.length) {
                return next(new NotFoundError(404, "User not found with this id"))
            }
            await pool.query("delete from mentor_profile where user_id=$1", [userId])
            await pool.query("delete from users where id=$1", [userId])

            return {
                status: 200,
                message: "User deleted"
            }
        } catch (error) {
            return next(new InternalServerError(500, error.message))
        }
    }
}

const userService = new UserServices()

export default userService
