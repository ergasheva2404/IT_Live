import pool from "../config/db.js"
import { ConflictError, NotFoundError } from "../utils/error.js"

class CategoriesService {

    async getAllCategories() {
        const categories = await pool.query("select * from categories where status='active'")

        return {
            status: 200,
            data: categories.rows
        }
    }
    async createCategory(req, next) {
        const { name } = req.body

        const existCategory = await pool.query("select * from categories where name = $1", [name])

        if (existCategory.rows.length) {
            return next(new ConflictError("Category already exists with this name!"))

        }

        await pool.query("insert into categories(name) values ($1)", [name])

        return {
            status: 201,
            message: "Category created!"
        }
    }
    async updateCategory(req, next) {
        try {
            const { id } = req.params
            const { name } = req.body

            const existCategory = await pool.query("select * from categories where id=$1", [id])
            if (!existCategory.rows.length) {
                return next(new NotFoundError(404, "Category not found with this id"))
            }

            const existName = await pool.query("select * from categories where name=$1 and id!=$2", [name, id])
            if (existName.rows.length) {
                return next(new ConflictError(409, "Category already exists with this name!"))
            }

            await pool.query("update categories set name=$1 where id=$2", [name, id])

            return {
                status: 200,
                message: "Category updated!"
            }
        } catch (error) {
            if (error.code === "23505") {
                return next(new ConflictError(409, "Category already exists with this name!"))
            }
            return next(new InternalServerError(500, error.message))
        }
    }
    async deleteCategory(req, next) {
        try {
            const { id } = req.params

            const existCategory = await pool.query("select * from categories where id=$1", [id])
            if (!existCategory.rows.length) {
                return next(new NotFoundError(404, "Category not found with this id"))
            }

            const existCourses = await pool.query(
                "select id from courses where category_id=$1 limit 1",
                [id]
            )
            if (existCourses.rows.length) {
                return next(new ConflictError(409, "Cannot delete category: it has courses"))
            }

            await pool.query("delete from categories where id=$1", [id])

            return {
                status: 200,
                message: "Category deleted!"
            }
        } catch (error) {
            if (error.code === "23503") {
                return next(new ConflictError(409, "Cannot delete category: it is used by other records"))
            }
            return next(new InternalServerError(500, error.message))
        }
    }
    
}

const categoriesService = new CategoriesService

export default categoriesService