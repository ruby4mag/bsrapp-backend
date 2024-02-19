import express from "express"
import {
    stravaRedirect, webhookSubscribtion
} from "../controllers/stravaController.js"
const router = express.Router()

router.route("/redirect").get(stravaRedirect)

router.route("/webhooksubscribtion").get(webhookSubscribtion).post(webhookSubscribtion)



export default router
