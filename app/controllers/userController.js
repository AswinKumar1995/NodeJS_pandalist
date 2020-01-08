const mongoose = require("mongoose");
const shortId = require("shortid");
const time = require("./../libs/timeLib");
const response = require("./../libs/responseLib");
const logger = require("./../libs/loggerLib")
const validateInput = require("./../libs/paramsValidationLib")
const check = require("./../libs/checkLib");
const passwordLib = require("./../libs/generatePasswordLib")
const token = require("./../libs/tokenLib")
const nodemailer = require("nodemailer")
const UserModel = mongoose.model("User")
const AuthModel = mongoose.model("Auth")
const ResetTokenModel = mongoose.model("ResetToken")
const crypto = require("crypto")

// get all users details

let getAllUser = (req, res) => {
    UserModel.find()
        .select(" -__v -_id")
        .lean()
        .exec((err, result) => {
            if (err) {
                logger.error(err.message, "UserController : getAllUser", 10)
                let apiResponse = response.generate(true, "Failed to find user details", 500, null)
                res.send(apiResponse)
            }
            else if (check.isEmpty(result)) {
                logger.error("No User details present", "UserController: getAllUser", 10)
                let apiResponse = response.generate(true, "No users found", 404, null)
                res.send(apiResponse)
            }
            else {
                let apiResponse = response.generate(false, "All user details found", 200, result)
                res.send(apiResponse)
            }
        })
}

//get single user data

let getSingleUser = (req, res) => {
    UserModel.findOne({ 'userId': req.params.userId })
        .select(" -__v -_id -password")
        .lean()
        .exec((err, result) => {
            if (err) {
                logger.error(err.message, "UserController : getAllUser", 10)
                let apiResponse = response.generate(true, "Failed to find user details", 500, null)
                res.send(apiResponse)
            }
            else if (check.isEmpty(result)) {
                logger.error("No User details present", "UserController: getAllUser", 10)
                let apiResponse = response.generate(true, "No users found", 404, null)
                res.send(apiResponse)
            }
            else {
                let apiResponse = response.generate(false, "User details found", 200, result)
                res.send(apiResponse)
            }
        })
}


//reset Token for mailId

let sendResetPasswordMail = (req, res) => {

    let findUser = () => {
        console.log("Find User")
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                console.log("req.body.email is present")
                console.log(req.body)
                UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
                    // handling the error when user is not present
                    if (err) {
                        console.log(err);
                        logger.error("Failed to retreive user data", "userController : findUser", 10)
                        let apiResponse = response.generate(true, "Failed to find User id", 500, null)
                        reject(apiResponse)
                    }
                    else if (check.isEmpty(userDetails)) {
                        logger.error("No user Found", "User Controller : findUser", 7)
                        let apiResponse = response.generate(true, "No User details available", 500, null)
                        reject(apiResponse)
                    }
                    else {
                        logger.info("user found", "userController : findUser ()", 10)
                        resolve(userDetails)
                    }
                })
            }
            else {
                let apiResponse = response.generate(true, "email parameter is missing", 400, null)
                reject(apiResponse)
            }
        })
    }

    let createToken = (userDetails) => {
        return new Promise((resolve, reject) => {
            console.log("Create token for resetting password")
            var resettoken = new ResetTokenModel({
                userId: userDetails.userId,
                resettoken: crypto.randomBytes(16).toString('hex')
            })
            resettoken.save(function (err) {
                if (err) {
                    let apiResponse = response.generate(true, err.message, 500, null)
                    reject(apiResponse)
                }
            })
            ResetTokenModel.find({ userId: userDetails.userId, resettoken: { $ne: resettoken.resettoken } }).remove().exec();
            // resolve()

            var transporter = nodemailer.createTransport({
                // service: 'gmail',
                // port: 465,
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: '****@gmail.com',
                    pass: '*****'
                }
            });

            var mailOptions = {
                from: '****',
                to: req.body.email,
                subject: 'Nodejs Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://localhost:4200/response-reset-password/' + resettoken.resettoken + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            }
            console.log(mailOptions)
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    logger.error("Failed to send message", "userController : sendMail", 10)
                    let apiResponse = response.generate(true, err.message, 500, null)
                    reject(apiResponse)
                }
                else {
                    let apiResponse = response.generate(false, "Reset Password mail sent successfully", 200, null)
                    resolve(apiResponse)
                }
            })
        }
        )
    }


    findUser(req, res)
        .then(createToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Reset Password mail sent successfully", 200, null)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("error handler")
            console.log(err)
            res.status(err.status)
            res.send(err)
        })
}


//validate token for resetting password

let resetUserPassword = (req, res) => {


    let validpasswordToken = () => {
        return new Promise((resolve, reject) => {
            
            if (!req.body.resettoken) {
                logger.error("Failed to send message", "userController : resetpassword", 10)
                let apiResponse = response.generate(true, "Token is required", 500, null)
                reject(apiResponse)
            }
            ResetTokenModel.findOne({ resettoken: req.body.resettoken }).exec((err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to reset password", "userController : resetpassword", 10)
                    let apiResponse = response.generate(true, err.message, 500, null)
                    reject(apiResponse)
                }
                else if (check.isEmpty(tokenDetails)) {
                    logger.error("Failed to reset password", "userController : resetpassword", 10)
                    let apiResponse = response.generate(true, "Invalid Token", 404, null)
                    reject(apiResponse)
                }
                else {
                    UserModel.findOne({ userId: tokenDetails.userId }).exec((err, userDetails) => {
                        if (err) {
                            logger.error(err.message, 'userController : resetPassword', 10);
                            let apiResponse = response.generate(true, "Failed to search user", 500, null)
                            reject(apiResponse)
                        }
                        else if (check.isEmpty(userDetails)) {
                            logger.error("Failed to reset password", "userController : resetpassword", 10)
                            let apiResponse = response.generate(true, "UserId is not present", 404, null)
                            reject(apiResponse)
                        }
                        else {
                            // let apiResponse = response.generate(False,"User Details are present",200,userDetails)
                            resolve(userDetails)
                        }
                    })
                }
            })
        })
    }
    let NewPassword = (userDetails) => {
        return new Promise((resolve, reject) => {
            UserModel.updateOne({ 'userId': userDetails.userId }, { $set: { 'password': passwordLib.hashpassword(req.body.password) } }, (err, result) => {
                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, "Error Occured", 500, null)
                    reject(apiResponse)
                }
                else if (check.isEmpty(result)) {
                    console.log("No User Id found")
                    let apiResponse = response.generate(true, "No Notifications found", 404, null)
                    reject(apiResponse)
                }
                else {
                    console.log(result)
                    let apiResponse = response.generate(false, "New password is Update", 200, null)
                    resolve(apiResponse)
                }
            })

        })
    }

    validpasswordToken(req, res)
        .then(NewPassword)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Password is updated successfully", 200, null)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("error handler")
            console.log(err)
            res.status(err.status)
            res.send(err)
        })
}


//delete user by userId
let deleteUser = (req, res) => {
    UserModel.findOneAndRemove({ "userId": req.params.userId }).exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: deleteUser', 10)
            let apiResponse = response.generate(true, 'Failed To delete user', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: deleteUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Deleted the user successfully', 200, result)
            res.send(apiResponse)
        }
    })
}

//edit user details by userId
let editUser = (req, res) => {
    let options = req.body
    UserModel.update({ "userId": req.params.userId, options }).exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller:editUser', 10)
            let apiResponse = response.generate(true, 'Failed To edit user details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: editUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'User details edited', 200, result)
            res.send(apiResponse)
        }
    })
}




let signUpFunction = (req, res) => {
    console.log("sign up user")
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                //validates email with regex
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, "Email does not meet the requirement", 400, null)
                    reject(apiResponse)
                }
                // checks if password is empty
                else if (check.isEmpty(req.body.password)) {
                    let apiResponse = response.generate(true, "Password parameter is missing", 400, null)
                    reject(apiResponse)
                }
                // send the req object if no issue
                else {
                    resolve(req)
                }
            }
            else {
                logger.error("Field missing during user creation", "userController :: createUser()", 5)
                let apiResponse = response.generate(true, "One or More parameter is missing", 400, null)
                reject(apiResponse)
            }
        })
    }

    let createUser = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController : createUser', 10);
                        let apiResponse = response.generate(true, "Failed to create user", 500, null)
                        reject(apiResponse)
                    }
                    else if (check.isEmpty(retrievedUserDetails)) {
                        console.log(req.body);
                        let newUser = new UserModel({
                            userId: shortId.generate(),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName || "",
                            email: req.body.email.toLowerCase(),
                            mobileNumber: req.body.mobileNumber,
                            password: passwordLib.hashpassword(req.body.password),
                            createdOn: time.now()
                        })
                        newUser.save((err, newUser) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, "userController : createUser", 10)
                                let apiResponse = response.generate(true, "Failed to create new user", 500, null)
                                reject(apiResponse)
                            }
                            else {
                                let newUserObj = newUser.toObject();
                                resolve(newUserObj)
                            }
                        })
                    }

                    else {
                        logger.error("User cannot be created. User Email already present", "userController:createUser", 10)
                        let apiResponse = response.generate(true, "User Already Present ", 500, null)
                        reject(apiResponse)
                    }
                })
        })
    } // end create User
    console.log("create user")
    validateUserInput(req, res)
        .then(createUser)
        .then((resolve) => {
            delete resolve.password;
            let apiResponse = response.generate(false, "user Created", 200, resolve);
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })
}

// start login function

let loginFunction = (req, res) => {

    let findUser = () => {
        console.log("Find User")
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                console.log("req.body.email is present")
                console.log(req.body)
                UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
                    // handling the error when user is not present
                    if (err) {
                        console.log(err);
                        logger.error("Failed to retreive user data", "userController : findUser", 10)
                        let apiResponse = response.generate(true, "Failed to find User id", 500, null)
                        reject(apiResponse)
                    }
                    else if (check.isEmpty(userDetails)) {
                        logger.error("No user Found", "User Controller : findUser", 7)
                        let apiResponse = response.generate(true, "No User details available", 500, null)
                        reject(apiResponse)
                    }
                    else {
                        logger.info("user found", "userController : findUser ()", 10)
                        resolve(userDetails)
                    }
                })
            }
            else {
                let apiResponse = response.generate(true, "email parameter is missing", 400, null)
                reject(apiResponse)
            }
        })
    }
    let validatePassword = (retrievedUserDetails) => {
        console.log("validate Password")
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, "userController : validatePassword()", 10);
                    let apiResponse = response.generate(true, "Login Failed", 500, null)
                    reject(apiResponse)
                }
                else if (isMatch) {
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject();
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                    delete retrievedUserDetailsObj.modifiedOn
                    resolve(retrievedUserDetailsObj)
                }
                else {
                    logger.info("Login Failed due to Invalid password", "userController: validatePassword()", 10)
                    let apiResponse = response.generate(true, "Wrong Password", 400, null)
                    reject(apiResponse)
                }
            })
        })

    }

    let generateToken = (userDetails) => {
        console.log("generate token")
        return new Promise((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null)
                    reject(apiResponse)
                }
                else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })

        })
    }

    let saveToken = (tokenDetails) => {
        console.log("Save token")
        console.log(tokenDetails)
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    logger.error(err.message, "UserController : saveToken", 10)
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null)
                    reject(apiResponse)
                }
                else if (check.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newtTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, "UserController: saveToken", 10)
                            let apiResponse = response.generate(true, "Failed to save token", 500, null)
                            reject(apiResponse)
                        }
                        else {
                            let responseBody = {
                                authToken: newtTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
                else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err, newtTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, "userController: savetoken", 10)
                            let apiResponse = response.generate(true, "Failed to generate token", 500, null)
                            reject(apiResponse)
                        }
                        else {
                            let responseBody = {
                                authToken: newtTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    }

    findUser(req, res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Login Successful", 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("error handler")
            console.log(err)
            res.status(err.status)
            res.send(err)
        })
};
let logout = (req, res) => {
    AuthModel.findOneAndRemove({ "userId": req.user.userId }, (err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'user Controller: logout', 10)
            let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'Already Logged Out or Invalid UserId', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Logged Out Successfully', 200, null)
            res.send(apiResponse)
        }
    })
}

module.exports = {
    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout,
    getAllUser: getAllUser,
    getSingleUser: getSingleUser,
    deleteUser: deleteUser,
    editUser: editUser,
    sendResetPasswordMail: sendResetPasswordMail,
    resetUserPassword: resetUserPassword
}