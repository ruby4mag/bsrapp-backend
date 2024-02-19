import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"
import generateToken from "../utils/generateToken.js"
import sendEmail from "../utils/sendEmail.js"
import crypto from "crypto"

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    })
  } else {
    res.status(401)
    throw new Error(" Invalid email or password")
  }
})

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400)
    throw new Error("User already Exists")
  }

  const user = await User.create({ name, email, password })

  if (user) {
    generateToken(res, user._id)
    res.status(201)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    })
  } else {
    res.status(400)
    throw new Error("Invalid User Credentials")
  }
})

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body._id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    if (req.body.password) user.password = req.body.password
    await user.save()
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    })
  } else {
    res.status(404)
    throw new Error("User Not Found")
  }
})

const logoutUser = asyncHandler(async (req, res) => {

  console.log("Logout cookies are " + JSON.stringify(req.cookies))
  res.cookie("jwt", "", {
    sameSite: 'lax', // lax is important, don't use 'strict' or 'none'
    httpOnly: true, // must be true in production
    path: '/',
    domain: process.env.ENVIRONMENT === 'development' ? '' : `.bsrsport.org`, // the period before is important and intentional


  })
  res.cookie("connect.sid", "", {
    sameSite: 'lax', // lax is important, don't use 'strict' or 'none'
    httpOnly: true, // must be true in production
    path: '/',
    domain: process.env.ENVIRONMENT === 'development' ? '' : `.bsrsport.org`, // the period before is important and intentional

  })
  res.status(200).json({
    message: "Logged Out Successfully",
  })
})

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })

  if (!user) {
    res.status(404)
    throw new Error("User Not Found")
  }

  const resetToken = user.createPasswordResetToken()
  user.save()

  const resetUrl = `${req.protocol}://localhost:3000/reset-password/${resetToken}`

  const message = `Forgot Password? Click on this this link to reset your Password: ${resetUrl}`

  try {
    await sendEmail({
      email: user.email,
      subject: "Your Password reset token. (valid for 10mins)",
      message,
    })

    res.status(200).json({
      message: "Token Sent to email!",
    })
  } catch (error) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.save()
    console.log(error)

    res.status(500).json({
      status: "error",
      message:
        "There was an error in sending the email. Please Try again later",
    })
  }
})

const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex")

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  if (!user) {
    res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    })
  }

  user.password = req.body.password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  user.save()

  generateToken(res, user._id)

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  })
})

export {
  loginUser,
  registerUser,
  updateUserProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
}
