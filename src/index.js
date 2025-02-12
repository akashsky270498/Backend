import dotenv from "dotenv";
import connectDB from "./db/connection.js";

dotenv.config({
    path: './env'
});

connectDB();

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