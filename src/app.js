import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dataLimit } from "./constants.js";

const app = express()

//Configuring the CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

//Setting limit for JSON
app.use(express.json({
    limit: dataLimit
}));

//Configuring URL
app.use(express.urlencoded({
    extended: true, // nested objects are allowed
    limit: dataLimit
}));

// Configuring Static files
app.use(express.static("public"));

//Configuring cookie parser
app.use(cookieParser()); // to access & set the cookies from my server present in user browser's.

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subcriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subcriptionRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);

export default app;