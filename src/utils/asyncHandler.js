/*
const asyncHandler = () => {}
const asyncHandler = (fn) => async () => {} 
*/

//We will use higher order function means a function that takes one function as an argument &  returns a function.



//using promise
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    }
}
// using try-catch 

// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         //We will use the function that we pass as an argument.
//         await func(req, res, next);
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

export { asyncHandler };
