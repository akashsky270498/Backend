import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

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
export {
    registerUser
}