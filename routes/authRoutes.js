import express from "express"
import passport from "passport"
import axios from "axios"
import User from "../models/userModel.js"
import generateToken from "../utils/generateToken.js"
import dotenv from "dotenv"
import cookie from "cookie"
import jwt from "jsonwebtoken"

dotenv.config()

const router = express.Router()

//authenticate the user using google
// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     successRedirect: process.env.CLIENT_URL,
//     failureRedirect: `${process.env.CLIENT_URL}/login/failed`,
//   })
// )

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {

    if (err || !user) {
      console.dir(err);
      var message =
        info && info.message
          ? encodeURIComponent(info.message + " Please try again or try another login method.")
          : encodeURIComponent(
            "There was an error logging you in. Please try another login method."
          );
      return res.redirect(
        process.env.BASE_CLIENT_URL + "/login?error=" + message
      );
    }
    req.login(user, { session: false }, async (err) => {
      console.log("USER is " + JSON.stringify(user))
      if (err) {
        console.dir(err);
        return res.redirect(
          process.env.BASE_CLIENT_URL +
          "/login?error=" +
          encodeURIComponent(
            "Invalid User. Please try another account or register a new account."
          )
        );
      }

      let userFound = ""
      const userExists = await User.findOne({ email: req.user._json.email })
      if (userExists) {
        userFound = userExists._id
      } else {
        console.log("Creating user in call back " + req.user._json.email)
        const newUser = new User({
          name: req.user._json.name,
          email: req.user._json.email,
          password: Date.now(), //dummy password
        })
        //generateToken(res, newUser._id)
        await newUser.save()
        userFound = newUser._id
      }

      const userId = userFound


      const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      })

      res.clearCookie("auth");
      res.setHeader(
        'Set-Cookie',
        cookie.serialize('jwt', token, { // XSRF-TOKEN is the name of your cookie
          sameSite: 'lax', // lax is important, don't use 'strict' or 'none'
          httpOnly: true, // must be true in production
          path: '/',
          //secure: process.env.ENVIRONMENT !== 'development', // must be true in production
          //maxAge: 60 * 60 * 24 * 7 * 52, // 1 year
          domain: process.env.COOKIE_DOMAIN, // the period before is important and intentional
        })
      )

      res.redirect(process.env.CLIENT_URL)

    });
  })(req, res, next);
});

//forward the request to goggle's authentication server
router.get("/google", async (req, res) => {
  try {
    const response = await axios.get(
      "https://accounts.google.com/o/oauth2/v2/auth",
      {
        params: req.query,
      }
    )
    res.send(response)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

//register or login user to DB
router.get("/login/success", async (req, res) => {
  const token = req.cookies.jwt
  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("Hiiting success route")
    if (decoded.userId) {
      const userExists = await User.findById(decoded.userId)
      if (userExists) {
        generateToken(res, userExists._id)
      } else {
        console.log("Creating user in success " + req.user._json.email)
        const newUser = new User({
          name: req.user._json.name,
          email: req.user._json.email,
          password: Date.now(), //dummy password
        })
        generateToken(res, newUser._id)
        await newUser.save()
      }
      res.status(200).json({


        //user: { name: userExists.name, email: userExists.email, _id: userExists._id, isAdmin: userExists.isAdmin, test: "something" },
        isAdmin: userExists.isAdmin,
        name: userExists.name,
        email: userExists.email,
        //message: "Succesfully logged in",
        _id: userExists._id,
      })
    }
  } else {
    res.status(403).json({
      message: "Not Authorized",
    })
  }
})

//login failed
router.get("/login/failed", (req, res) => {
  res.status(401)
  throw new Error("Login Failed")
})

//logout
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) {
      console.log(err)
    }
    res.redirect("/")
  })
})

export default router
