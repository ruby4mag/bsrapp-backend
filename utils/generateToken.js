import { request } from "http"
import jwt from "jsonwebtoken"

const generateToken = (req, res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
  let domain = process.env.COOKIE_DOMAIN
  if (req.hostname != '95.217.158.79') {
    domain = "*"
  }

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, //30days
    domain: domain
  })
}

export default generateToken
