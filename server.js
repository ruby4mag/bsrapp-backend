
import './instrumentation.js';
import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/db.js"
import activityRoutes from "./routes/activityRoutes.js"
import ruleRoutes from "./routes/ruleRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import { errorHandler, notFound } from "./middleware/errorMiddleware.js"
import cookieParser from "cookie-parser"
import passport from "./utils/passport.js"
import authRoutes from "./routes/authRoutes.js"
import stravaRoutes from "./routes/stravaRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import stripe from "./utils/stripe.js"
import amqp from 'amqplib/callback_api.js';
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('dice-lib');

let ch = null;
amqp.connect(process.env.CONN_URL, function (err, conn) {
  conn.createChannel(function (err, channel) {
    ch = channel;
  });
});

export const publishToQueue = async (queueName, data) => {
  ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
}
process.on('exit', (code) => {
  ch.close();
  console.log(`Closing rabbitmq channel`);
});


dotenv.config()

connectDB()

const PORT = process.env.PORT || 8000

const app = express()


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000")
  next()
})

app.use(
  cors({
    origin: ["https://react.bsrsport.org", "http://192.168.1.201:3001", "https://www.bsrsport.org"],
    //origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
    methods: "GET, POST, PATCH, DELETE, PUT",
    credentials: true,
  })
)

app.use(cookieParser())
passport(app)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

stripe(app)

app.get("/", (req, res) => {
  res.send("Api is running...")
})

app.use("/api/activities", activityRoutes)
app.use("/api/rules", ruleRoutes)
app.use("/api/users", userRoutes)
app.use("/auth", authRoutes)
app.use("/api/orders", orderRoutes)
app.use("/strava", stravaRoutes)
app.use("/api/admin", adminRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  return tracer.startActiveSpan('rollTheDice', (span) => {
    console.log(`Server is runing on port ${PORT}`)
    span.end();
  });

})
