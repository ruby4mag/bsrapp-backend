import User from "../models/userModel.js"
import Activity from "../models/activityModel.js"
import asyncHandler from "express-async-handler"
import axios from 'axios';
import jwt from "jsonwebtoken"
import { publishToQueue } from '../server.js'


const exchange_name = 'BSR-exchange';
const exchange_type = 'direct';

const stravaRedirect = asyncHandler(async (req, res) => {
    const token = req.cookies.jwt
    if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        axios.post('https://www.strava.com/api/v3/oauth/token', {
            client_id: '120373',
            client_secret: '3319dd8ae0862abf96bb07f0c1472bb1fe6a8299',
            code: req.query.code,
            grant_type: "authorization_code"
        })
            .then(async function (stravares) {
                // Add the strava details to User Model
                const user = await User.findById(decoded.userId)

                if (user) {
                    user.strava_integrated = true
                    user.strava_rt = stravares.data.refresh_token
                    user.strava_at = stravares.data.access_token
                    user.strava_token_expires = stravares.data.expires_at
                    user.strava_athlete_id = stravares.data.athlete.id
                    user.strava_athlete_username = stravares.data.athlete.username
                    user.strava_athlete_firstname = stravares.data.athlete.firstname
                    user.strava_athlete_lastname = stravares.data.athlete.lastname
                    user.strava_athlete_profile_medium = stravares.data.athlete.profile_medium
                    user.strava_athlete_profile = stravares.data.athlete.profile
                    user.moniker_type = 'general'
                    user.save()
                }
                res.json({
                    status: "success",
                })
            })
            .catch(function (error) {
                console.log(error);
                res.json({
                    status: "faulure",
                })
            });
    }
})

const webhookSubscribtion = asyncHandler(async (req, res) => {


    console.log("Subscripion Call back received " + JSON.stringify(req.body))

    if (req.query['hub.verify_token'] != undefined && req.query['hub.verify_token'] == 'bsrsport-webhook') {
        res.json({
            'hub.challenge': req.query['hub.challenge']
        })
    } else {
        publishToQueue("activities", req.body);
        res.json({
            status: "success",
        })
    }

})



export {
    stravaRedirect, webhookSubscribtion
}
