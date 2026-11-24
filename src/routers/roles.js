import express from "express"
import roleController from "../controllers/roles.js"
import authGuard from "../guards/auth.guard.js"
import {roleGuard} from "../guards/role.guard.js"


const router = express.Router()

router
.get("/roles/all", roleController.getAllRoles)
.post ("/roles", authGuard, roleGuard("admin"), roleController.createRole)
.put("/roles/:id", authGuard, roleGuard("admin"), roleController.updateRole)
.delete("/roles/:id", authGuard, roleGuard("admin"),roleController.deleteRole)


export default router