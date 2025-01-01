import asyncHandler from "express-async-handler"
import Activity from "../models/activityModel.js"
import User from "../models/userModel.js"
import axios from 'axios';
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('dice-lib');

const getActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ user: req.user._id }).sort({ start_date: -1 }).populate(
    "user",
    "id name"
  )
  res.json(activities)
})

const getActivityById = asyncHandler(async (req, res) => {
  console.log("Hitting here")
  const Activitystats = await Activity.findById(req.params.id).populate(
    "user",
    "name email"
  )
})

const getPastActivities = asyncHandler(async (req, res) => {
  console.log("Hitting load past activity route")

  const periods = {
    2020: [1577836800, 1609459200],
    2021: [1609459200, 1640995200],
    2022: [1640995200, 1672531200],
    2023: [1672531200, 1704067200],
    2024: [1704067200, 1735689600],
    2025: [1735689600, 1767225600],
  }
  const user = await User.findById(req.user.id)
  // the strava_athlete_id 
  await axios.post("https://www.strava.com/api/v3/oauth/token", {
    client_id: '120373',
    client_secret: '3319dd8ae0862abf96bb07f0c1472bb1fe6a8299',
    grant_type: "refresh_token",
    refresh_token: user.strava_rt

  })
    .then(async (res1) => {
      console.log("Access Token is " + res1.data.access_token)
      user.starva_rt = res1.data.refresh_token
      user.starva_at = res1.data.access_token
      user.strava_token_expires = res1.data.expires_at
      user.save

      const years = Object.keys(periods)

      for (const year of years) {
        const before = periods[year][1]
        const after = periods[year][0]

        console.log("Processing Year " + year)
        console.log("Processing Before " + before)
        console.log("Processing After " + after)



        // ge the summary data for the year and populate the DB

        await axios.get(`https://www.strava.com/api/v3/athlete/activities?per_page=200&page=1&before=${before}&after=${after}`, {
          headers: {
            'Authorization': 'Bearer ' + res1.data.access_token
          }
        }).then(async (res2) => {

          const recivedActivities = res2.data
          for (const ra of recivedActivities) {


            // check if the activity is already present
            const existingactivity = await Activity.findOne({ act_id: ra.id })

            if (!existingactivity) {
              console.log("Adding new past activity " + ra.id)
              const newPastActivity = {
                user: user._id,
                act_id: ra.id,
                name: ra.name,
                distance: ra.distance,
                moving_time: ra.moving_time,
                elapsed_time: ra.elapsed_time,
                total_elevation_gain: ra.total_elevation_gain,
                type: ra.type,
                sport_type: ra.sport_type,
                start_date: ra.start_date,
                start_date_local: ra.start_date_local,
                timezone: ra.timezone,
                start_latlng: ra.start_latlng,
                end_latlng: ra.end_latlng,
                trainer: ra.trainer,
                commute: ra.commute,
                manual: ra.manual,
                private: ra.private,
                flagged: ra.flagged,
                gear_id: ra.gear_id,
                average_speed: ra.average_speed,
                max_speed: ra.max_speed,
                average_cadence: ra.average_cadence,
                average_temp: ra.average_temp,
                average_watts: ra.average_watts,
                weighted_average_watts: ra.weighted_average_watts,
                kilojoules: ra.kilojoules,
                max_watts: ra.max_watts,
                elev_high: ra.elev_high,
                elev_low: ra.elev_low,
                workout_type: ra.workout_type,
                description: ra.description,
                calories: ra.calories,
                device_name: ra.device_name,
                gear: ra.gear,
                map: JSON.stringify(ra.map)
              }


              const savedactivity = await Activity.create(newPastActivity)
              if (savedactivity) {
                user.activities.push(savedactivity._id)
                await user.save().then((_res) => {
                  console.log("Actvity Saved")
                })
              } else {
                console.log("Error attaching activity to user " + err)
              }
            } else {
              console.log(" Activity already exist")
            }
          }
        })
      }
    })
  res.json({
    status: "success"
  })
})

const getActivityRideDistance = asyncHandler(async (req, res) => {
  tracer.startActiveSpan('getActivityRideDistance', async (span) => {
    // Be sure to end the span!
    const e = new Date()
    e.setDate(e.getDate() + 1)
    e.setHours(0, 0, 0, 0);
    const end = e.toISOString()
    e.setDate(e.getDate() - 30)
    e.setHours(0, 0, 0, 0);
    const start = new Date(e).toISOString();
    const Activitystats = await Activity.aggregate([{ $match: { start_date: { $gte: new Date(start), $lte: new Date(end), }, type: "Ride", user: req.user._id }, }, { $group: { _id: { $dateTrunc: { date: "$start_date", unit: "day", }, }, total: { $sum: "$distance", }, }, }, { $densify: { field: "_id", range: { step: 1, unit: "day", bounds: [new Date(start), new Date(end)] }, }, }, { $project: { _id: 0, day: { $dateToString: { format: "%m-%d", date: "$_id" } }, type: 1, total: { $cond: [{ $not: ["$total"], }, 0, "$total",], }, }, },])
    console.log("Activity stats are " + JSON.stringify(Activitystats))
    const keys = []
    const values = []
    Activitystats.forEach((i) => {
      keys.push(i['day'])
      values.push(i['total'])
    });
    var send = {}
    send['labels'] = keys
    send['values'] = values.map((v) => { return v / 1000 })
    res.json(send)
    span.end();
  })
})

const getActivityTotals = asyncHandler(async (req, res) => {

  tracer.startActiveSpan('getActivityTotals', async (span) => {
    // Be sure to end the span!
    const e = new Date()
    const end = e.toISOString()
    e.setDate(e.getDate() - 30)
    const ActivityTotals = await Activity.aggregate([{ $match: { user: req.user._id, }, }, { $group: { _id: "$type", total: { $sum: "$distance", }, }, }, { $project: { all: 1, total: 1, }, },])
    console.log("Activity Totals are " + JSON.stringify(ActivityTotals))
    const keys = []
    const values = []
    ActivityTotals.forEach((i) => {
      keys.push(i['_id'])
      values.push(i['total'])
    });

    var send = {}
    send['labels'] = keys
    send['values'] = values.map((v) => { return v / 1000 })
    res.json(send)
    span.end();
  })
});

const getActivitymax = asyncHandler(async (req, res) => {
  tracer.startActiveSpan('getActivitymax', async (span) => {
    // Be sure to end the span!
    const e = new Date()
    const end = e.toISOString()
    e.setDate(e.getDate() - 30)
    const ActivityTotals = await Activity.aggregate([{ $match: { user: req.user._id, }, }, { $group: { _id: "$type", total: { $max: "$distance", }, }, }, { $project: { all: 1, total: 1, }, },])
    console.log("Activity Max are " + JSON.stringify(ActivityTotals))
    var send = {}
    ActivityTotals.forEach((i) => {
      send[i['_id']] = (i['total'] / 1000).toFixed(2)
    });

    res.json(send)
    span.end();
  })
})






const getActivityDistanceYear = asyncHandler(async (req, res) => {
  tracer.startActiveSpan('getActivityDistanceYear', async (span) => {
    // Be sure to end the span!
    const end = "2026-01-01"
    const start = "2019-01-01"
    const rideYearlyStats = await Activity.aggregate([{ $match: { start_date: { $gte: new Date(start), $lte: new Date(end), }, type: "Ride", user: req.user._id }, }, { $group: { _id: { $dateTrunc: { date: "$start_date", unit: "year", }, }, total: { $sum: "$distance", }, }, }, { $densify: { field: "_id", range: { step: 1, unit: "year", bounds: [new Date(start), new Date(end)] }, }, }, { $project: { _id: 0, year: { $dateToString: { format: "%Y", date: "$_id" } }, type: 1, total: { $cond: [{ $not: ["$total"], }, 0, "$total",], }, }, },])
    const runYearlyStats = await Activity.aggregate([{ $match: { start_date: { $gte: new Date(start), $lte: new Date(end), }, type: "Run", user: req.user._id }, }, { $group: { _id: { $dateTrunc: { date: "$start_date", unit: "year", }, }, total: { $sum: "$distance", }, }, }, { $densify: { field: "_id", range: { step: 1, unit: "year", bounds: [new Date(start), new Date(end)] }, }, }, { $project: { _id: 0, year: { $dateToString: { format: "%Y", date: "$_id" } }, type: 1, total: { $cond: [{ $not: ["$total"], }, 0, "$total",], }, }, },])

    const keys = []
    const ridevalues = []
    const runvalues = []
    rideYearlyStats.forEach((i) => {
      keys.push(i['year'])
      ridevalues.push(i['total'])
    });
    runYearlyStats.forEach((i) => {
      runvalues.push(i['total'])
    });
    var send = {}
    send['labels'] = keys
    send['ridevalues'] = ridevalues.map((v) => { return v / 1000 })
    send['runvalues'] = runvalues.map((v) => { return v / 1000 })
    res.json(send)
    span.end();
  })
})

const getActivityRunDistance = asyncHandler(async (req, res) => {
  tracer.startActiveSpan('getActivityRunDistance', async (span) => {
    // Be sure to end the span!
    const e = new Date()
    e.setDate(e.getDate() + 1)
    e.setHours(0, 0, 0, 0);
    const end = e.toISOString()
    e.setDate(e.getDate() - 30)
    e.setHours(0, 0, 0, 0);
    const start = new Date(e).toISOString();

    console.log("Start " + start)
    console.log("End " + end)

    const Activitystats = await Activity.aggregate([{ $match: { start_date: { $gte: new Date(start), $lte: new Date(end), }, type: "Run", user: req.user._id }, }, { $group: { _id: { $dateTrunc: { date: "$start_date", unit: "day", }, }, total: { $sum: "$distance", }, }, }, { $densify: { field: "_id", range: { step: 1, unit: "day", bounds: [new Date(start), new Date(end)] }, }, }, { $project: { _id: 0, day: { $dateToString: { format: "%m-%d", date: "$_id" } }, type: 1, total: { $cond: [{ $not: ["$total"], }, 0, "$total",], }, }, },])
    console.log("Activity stats are " + JSON.stringify(Activitystats))
    const keys = []
    const values = []
    Activitystats.forEach((i) => {
      keys.push(i['day'])
      values.push(i['total'])
    });
    var send = {}
    send['labels'] = keys
    send['values'] = values.map((v) => { return v / 1000 })
    res.json(send)
    span.end();
  })
})

const getActivityCalories = asyncHandler(async (req, res) => {
  tracer.startActiveSpan('getActivityCalories', async (span) => {
    // Be sure to end the span!
    const e = new Date()
    e.setDate(e.getDate() + 1)
    e.setHours(0, 0, 0, 0);
    const end = e.toISOString()
    e.setDate(e.getDate() - 30)
    e.setHours(0, 0, 0, 0);
    const start = new Date(e).toISOString();

    const Activitystats = await Activity.aggregate([{ $match: { start_date: { $gte: new Date(start), $lte: new Date(end), }, user: req.user._id }, }, { $group: { _id: { $dateTrunc: { date: "$start_date", unit: "day", }, }, total: { $sum: "$calories", }, }, }, { $densify: { field: "_id", range: { step: 1, unit: "day", bounds: [new Date(start), new Date(end)] }, }, }, { $project: { _id: 0, day: { $dateToString: { format: "%m-%d", date: "$_id" } }, type: 1, total: { $cond: [{ $not: ["$total"], }, 0, "$total",], }, }, },])
    console.log("Activity stats are " + JSON.stringify(Activitystats))
    const keys = []
    const values = []
    Activitystats.forEach((i) => {
      keys.push(i['day'])
      values.push(i['total'])
    });
    var send = {}
    send['labels'] = keys
    send['values'] = values
    res.json(send)
    span.end();
  })
})


export { getActivityById, getActivities, getActivityRideDistance, getActivityRunDistance, getActivityCalories, getPastActivities, getActivityDistanceYear, getActivityTotals, getActivitymax }
