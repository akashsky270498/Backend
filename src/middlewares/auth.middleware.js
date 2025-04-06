import { ApiError } from '../utils/apiError.js';
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        // const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer", "");
        const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer", "").trim();

        if (!token) {
            throw new ApiError(401, "Unauthorized request.");
        }

        //Verifying the token
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        //Finding the user in the database
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token.");
        }

        req.user = user;
        next();

    } catch (error) {
        return next(new ApiError(500, "Something went wrong while verifying the token."))
    }
})