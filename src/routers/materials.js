import express from "express"
import materialsController from "../controllers/materials.js"
import authGuard from "../guards/auth.guard.js"
import {roleGuard} from "../guards/role.guard.js"

const router = express.Router()

router
.get("/materials/:lessonId", authGuard, materialsController.getAllMaterials)
.post ("/materials", authGuard, roleGuard("admin", "teacher"), materialsController.createMaterial)
.put("/materials/:materialId", authGuard, roleGuard("admin", "teacher"), materialsController.updateMaterial)
.delete("/materials/:materialId", authGuard, roleGuard("admin", "teacher"), materialsController.deleteMaterial)


export default router