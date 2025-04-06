import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId);
        console.log(user)

        if (!user) {
            throw new ApiError(404, "User not found while generating tokens.");
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        console.log(accessToken)
        console.log(refreshToken)

        // Saving refresh token in the database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access & refresh tokens.")
    }
}

export { generateAccessAndRefreshTokens };