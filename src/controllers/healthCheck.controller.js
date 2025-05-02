import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const healthCheck = asyncHandler(async (req, res) => {

    try {

        const timestamps = new Date().toISOString();
        return res.status(200).json(
            new ApiResponse(200, timestamps, "Server is healthy and running.")
        )
    } catch (error) {
        console.error("Error ", error.message);
        throw new ApiError(500, "Internal server error.");
    }
})

export {
    healthCheck
}