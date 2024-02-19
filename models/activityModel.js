import mongoose from "mongoose"
import { json } from "stream/consumers"

const activitySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  act_id: {
    type: Number,
  },
  name: {
    type: String,
  },
  distance: {
    type: Number,
  },
  moving_time: {
    type: Number,
  },
  elapsed_time: {
    type: Number,
  },
  total_elevation_gain: {
    type: Number,
  },
  type: {
    type: String,
  },
  sport_type: {
    type: String,
  },
  start_date: {
    type: Date,
  },
  start_date_local: {
    type: Date,
  },
  timezone: {
    type: String,
  },
  start_latlng: {
    type: Array,
  },
  end_latlng: {
    type: Array,
  },
  trainer: {
    type: Boolean,
  },
  commute: {
    type: Boolean,
  },
  manual: {
    type: Boolean,
  },
  private: {
    type: Boolean,
  },
  flagged: {
    type: Boolean,
  },
  gear_id: {
    type: String,
  },
  average_speed: {
    type: Number,
  },
  max_speed: {
    type: Number,
  },
  average_cadence: {
    type: Number,
  },
  average_temp: {
    type: Number,
  },
  average_watts: {
    type: Number,
  },
  weighted_average_watts: {
    type: Number,
  },
  kilojoules: {
    type: Number,
  },
  max_watts: {
    type: Number,
  },
  elev_high: {
    type: Number,
  },
  elev_low: {
    type: Number,
  },
  workout_type: {
    type: Number,
  },
  description: {
    type: String,
  },
  calories: {
    type: Number,
  },
  device_name: {
    type: String,
  },
  map: {
    type: Object
  },
  segment_efforts: {
    type: Object
  },
  gear: {
    type: Object
  },
  laps: {
    type: Object
  }
},
  {
    timestamps: true,
  })


const Activity = mongoose.model("Activity", activitySchema)

export default Activity
