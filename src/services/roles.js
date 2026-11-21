import pool from "../config/db.js"
import { ConflictError, InternalServerError, NotFoundError } from "../utils/error.js"

class RoleService {

    async getRoles() {
        let roles = await pool.query("select * from roles")

        return {
            status: 200,
            data: roles.rows
        }
    }
    async createRole(req, next) {
        try {
            const { name } = req.body
            const existRole = await pool.query("select * from roles where name=$1", [name])
            if (existRole.rows.length) {
                return next(new ConflictError(409, "Role already exists"))
            }

            await pool.query(`insert into roles(name) values ($1)`, [name])

            return {
                status: 201,
                message: "Role created!"
            }
        } catch (error) {
            next(new InternalServerError(500, error))
        }
    }
    async updateRole(req, next) {
        try {
            const { id } = req.params
            const { name } = req.body

            const existRole = await pool.query("select * from roles where id=$1", [id])
            if (!existRole.rows.length) {
                return next(new NotFoundError(404, "Role not found with this id"))
            }

            const existName = await pool.query("select * from roles where name=$1 and id<>$2", [name, id])
            if (existName.rows.length) {
                return next(new ConflictError(409, "Role already exists"))
            }

            await pool.query("update roles set name=$1 where id=$2", [name, id])

            return {
                status: 200,
                message: "Role updated!"
            }
        } catch (error) {
            if (error.code === "23505") {
                return next(new ConflictError(409, "Role already exists"))
            }
            return next(new InternalServerError(500, error.message))
        }
    }
    async deleteRole(req, next) {
        try {
            const { id } = req.params

            const existRole = await pool.query("select * from roles where id=$1", [id])
            if (!existRole.rows.length) {
                return next(new NotFoundError(404, "Role not found with this id"))
            }

            const existUsers = await pool.query("select id from users where role_id=$1 limit 1", [id])
            if (existUsers.rows.length) {
                return next(new ConflictError(409, "Cannot delete role: it has users"))
            }

            await pool.query("delete from roles where id=$1", [id])

            return {
                status: 200,
                message: "Role deleted!"
            }
        } catch (error) {
            if (error.code === "23503") {
                return next(new ConflictError(409, "Cannot delete role: it is used by other records"))
            }
            return next(new InternalServerError(500, error.message))
        }
    }
}

const roleService = new RoleService()

export default roleService