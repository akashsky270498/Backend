import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js"

const registerUser = asyncHandler(async (req, res) => {
    // Taking user data from front-enf & destructuring it.
    const { fullName, email, username, password } = req.body;
    // console.log("Body:", req.body);

    //Checking if the fields are empty or not
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All the fields are required.");
    };


    //Checking if the user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with given username or email already exists.");
    }

    //Checking for images (avatar is required)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log("Files", req.files);

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required.")
    }

    //Uploading the fiels on Cloundinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Avatar upload failed.")
    }

    //Creating user object to save in the database
    const userData = {
        username,
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // using optional chain bcoz it is optional field
    }

    //Hiding password & refresh token field from response

    const user = await User.create(userData);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while regitering the user.")
    };

    return res.status(201).json(
        new ApiResponse(200, "User registered successfully.", createdUser)
    );

})

const loginUser = asyncHandler(async (req, res) => {
    //Taking username, email or password from front-end

    const { username, email, password } = req.body;

    //Checking if the fields are empty or not 
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required.")
    }

    //Finding the user in the database
    const userExistence = await User.findOne({
        $or: [
            { username }, { email }
        ]
    });

    //Checking if the user exists or not
    if (!userExistence) {
        throw new ApiError(404, "User not found.")
    }

    //Checking if the password is correct or not use "user not User" (we have already compared the password in user model)
    const isPasswordValid = await userExistence.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials.")
    }

    //Destructring access & refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userExistence._id);

    //Making DB call to get user details without password & refresh token
    const loggedInUser = await User.findById(userExistence._id).select("-password -refreshToken")

    //Cookies
    const options = {
        httpOnly: true,
        secure: true, // so that it can be modifiable in server not by front end
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User logged in successfully.", {
                user: loggedInUser,
                accessToken,
                refreshToken
            })
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const data = await User.findByIdAndUpdate(
        req?.user?.id,
        {
            $set: {
                refreshToken: undefined
            },
        },
        {
            new: true
        }
    )
    console.log("d", data)
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "User logged out successfully.", {})
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request.")
        }

        //Verifying the refresh token
        const decodedRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        //Finding the user in the database
        const user = await UserfindById(decodedRefreshToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token.");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used.");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        //Generating new access token
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user?._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", refreshToken)
            .json(
                200, "Refresh token generated successfully.",
                {
                    accessToken,
                    refreshToken
                }
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while refreshing the access token.")
    }
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}