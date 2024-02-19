import express from "express"
import { protect } from "../middleware/authMiddleware.js"

import {
    getRuleById,
    getRules,
    addUserActivityRules,
    updateRules
} from "../controllers/ruleController.js"
const router = express.Router()

router.route("/").get(protect, getRules)
router.route("/:id").get(protect, getRuleById)
router.route("/").post(protect, addUserActivityRules)
router.route("/:id").post(protect, updateRules)


export default router
