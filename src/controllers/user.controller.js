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

const changePassword = asyncHandler(async (req, res) => {

    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.user?._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old password.")
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Password changes successfully.")
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Internal server error.")
    }
})

const getUser = asyncHandler(async (req, res) => {
    try {

        return res.status(200)
            .json(
                new ApiResponse(200, "User retrieved successfully.", {
                    userData: req.user
                })
            )
    } catch (error) {
        throw new ApiError(500, "Internal server error", error?.message);
    }
})

const updateUser = asyncHandler(async (req, res) => {
    try {
        const { fullName, email } = req.body;

        if (!(fullName || email)) {
            throw new ApiError(400, "All fields are required.")
        }
        const updatedFields = {};
        if (fullName) updatedFields.fullName = fullName;
        if (email) updatedFields.email = email;

        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    updatedFields
                }
            },
            { new: true, select: "-password" }
        )

        return res
            .status(200)
            .json(200, "User details updated successfully.",
                {
                    data: updatedUser
                }
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "Internal server error.")
    }
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing.")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
            throw new ApiError(400, "Error while uploading on Cloudinary.")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            }, { new: true }
        ).select("-password");

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Avatar has been updated successfully.", user)
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Internal server error.")
    }
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        const { coverImageLocalPath } = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover image is missing.")
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage?.url) {
            throw new ApiError(400, "Error while uploading on Cloudinary.")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage?.url
                }
            },
            { new: true }
        ).select("-password");

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Cover image has been updated successfully.", user)
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Internal server error.");
    }
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    try {
        const username = req.parmas;

        if (!username?.trim()) {
            throw new ApiError(400, "Username is missing.");
        }

        const channel = User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: 'subscriptions', // always in lower case & it should be in plural form.
                    localField: '_id',
                    foreignField: 'channel',
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'subscriber',
                    as: 'subscribedTo'
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribers.subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
                    createdAt: 1
                }
            }
        ]);

        if (!channel?.length) {
            throw new Apierror(404, "Channel not found.")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, "User channel reterived successfully.", channel[0])
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Internal server error.")

    }
})

const getWatchHistory = asyncHandler(async (req, res) => {
    try {
        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        res
            .status(200
                .json(
                    new ApiResponse(200,
                        "user watch history retrieved successfully.",
                        user[0]?.getWatchHistory
                    )
                )
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Internal server error.");
    }
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}