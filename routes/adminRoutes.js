import express from "express"
import { protect } from "../middleware/authMiddleware.js"

import { addAdminActivityRules, getAdminRules, updateAdminRules, getAdminRuleById } from "../controllers/adminController.js"
const router = express.Router()

router.route("/rules/").get(protect, getAdminRules)
router.route("/rules/:id").get(protect, getAdminRuleById)
router.route("/rules/").post(protect, addAdminActivityRules)
router.route("/rules/:id").post(protect, updateAdminRules)

export default router