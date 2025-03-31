import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dataLimit } from "./constants";

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

export default app;