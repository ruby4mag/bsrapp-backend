import express from "express"
import { protect } from "../middleware/authMiddleware.js"

import {
  getActivityById,
  getActivities,
  getActivityRideDistance,
  getActivityRunDistance,
  getActivityCalories,
  getPastActivities,
  getActivityDistanceYear,
  getActivityTotals,
  getActivitymax
} from "../controllers/activityController.js"
const router = express.Router()

router.route("/getPastActivities").get(protect, getPastActivities)
router.route("/").get(protect, getActivities)
router.route("/getActivityRideDistance").get(protect, getActivityRideDistance)
router.route("/getActivityRunDistance").get(protect, getActivityRunDistance)
router.route("/getActivityCalories").get(protect, getActivityCalories)
router.route("/getActivityDistanceYear").get(protect, getActivityDistanceYear)
router.route("/getActivityTotals").get(protect, getActivityTotals)
router.route("/getActivitymax").get(protect, getActivitymax)

router.route("/:id").get(protect, getActivityById)





export default router
