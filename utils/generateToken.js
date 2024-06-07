import jwt from "jsonwebtoken"

const generateToken = (req, res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })

  res.cookie("jwt", token, {
    httpOnly: false,
    //secure: process.env.NODE_ENV !== "development",
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000, //30days
    secure: true
    //domain: process.env.COOKIE_DOMAIN
  })
}

export default generateToken
