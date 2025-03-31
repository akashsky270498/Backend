import connectDB from "./db/connection.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
    path: './env'
});

const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error;
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch( (error) => {
        console.log("Error connecting to the database: ", error);
        throw error;
    })

/*
//using IIFE we are trying to connect to the database and then start the server
; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("Error connecting to the database: ", error);
        throw error;
    }
})()

*/