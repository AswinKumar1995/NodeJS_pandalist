const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const request = require("request")
const Auth = mongoose.model("Auth")

const logger = require("./../libs/loggerLib")
const responseLib = require("./../libs/responseLib")
const token = require("./../libs/tokenLib")
const check = require("./../libs/checkLib")
let isAuthorised = (req,res,next) => {
    if (req.params.authToken || req.body.authToken || req.query.authToken || req.header("authToken")) {
        Auth.findOne({authToken:req.params.authToken || req.body.authToken || req.query.authToken || req.header("authToken")},(err,authDetails) => {
            if(err) {
                console.log(err)
                logger.error(err.message,"Auth Middleware : isAuthrorised",10)
                let apiResponse = responseLib.generate(true,"Failed to authorise",500,null)
                res.send(apiResponse)
            }
            else if (check.isEmpty(authDetails)) {
                logger.error("No authorizathion key present","Authorization middleware",10)
                let apiResponse = responseLib.generate(true,"Invalid  or Expired authorization key is present",404,null)
                res.send(apiResponse)
            }
            else {
                token.verifyClaim(authDetails.authToken,authDetails.tokenSecret,(err,decoded) => {
                    if(err){
                        logger.error(err.message,"Authorization middleware",10)
                        let apiResponse = responseLib.generate(true,"Failed to authorize",500,null)
                        res.send(apiResponse)
                    }
                    else {
                        req.userId = {userId:decoded.data.userId}
                        next()
                    }

                })
            } // end verify token
        })
    }
    else {
        logger.error("Authrization token is missing","authorization middleware",5)
        let apiResponse = responseLib.generate(true,"Authorization token is missing",400,null)
        res.send(apiResponse)
    }
}

module.exports = {
    isAuthorised:isAuthorised
}