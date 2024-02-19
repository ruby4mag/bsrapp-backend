import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    strava_integrated: {
      type: Boolean,
      default: false,
    },
    strava_rt: {
      type: String,
      default: null,
    },
    strava_at: {
      type: String,
      default: null,
    },
    strava_token_expires: {
      type: Number,
      default: null,
    },
    strava_athlete_id: {
      type: Number,
      default: null,
    },
    strava_athlete_username: {
      type: String,
      default: null,
    },
    strava_athlete_firstname: {
      type: String,
      default: null,
    },
    strava_athlete_lastname: {
      type: String,
      default: null,
    },
    strava_athlete_profile_medium: {
      type: String,
      default: null,
    },
    strava_athlete_profile: {
      type: String,
      default: null,
    },
    strava_latest_activity_id: {
      type: String,
      default: null,
    },
    moniker_type: {
      type: String,
      default: "general",
    },
    activities: {
      type: Array
    },
    rules: {
      type: Array
    },

    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
)

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex")

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 //10mins

  return resetToken
}

const User = mongoose.model("User", userSchema)

export default User
