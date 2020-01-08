const jwt = require("jsonwebtoken")
const shortid = require("shortid")
const secretKey = "someVeryRandomStringThatNobodyCanGuess"

let generateToken = (data, cb) => {
    try {
        let claims = {
            jwtid: shortid.generate(), //this fields are mentioned in official documentation
            iat: Date.now(),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            sub: "authToken",
            iss: 'edChat',
            data: data

        }
        let tokenDetails = {
            token: jwt.sign(claims, secretKey),
            tokenSecret: secretKey
        }
        cb(null, tokenDetails)
    }
    catch (err) {
        console.log(err)
        cb(err, null)

    }
} // end generate token

let verifyClaim = (token, secretKey, cb) => {
    // verifying a token
    jwt.verify(token, secretKey, function (err, decoded) {
        if (err) {
            console.log("error while verifying token")
            console.log(err)
            cb(err, null)
        }
        else {
            console.log("user verified")
            console.log(decoded)
            cb(null, decoded)
        }
    })
}

let verifyClaimWithoutSecret = (token,cb) => {
    jwt.verify(token, secretKey, function (err, decoded) {
        if (err) {
            console.log("error while verifying token")
            console.log(err)
            cb(err, null)
        }
        else {
            console.log("user verified")
            console.log(decoded)
            cb(null, decoded)
        }
    })

}

module.exports = {
    generateToken: generateToken,
    verifyClaim: verifyClaim,
    verifyClaimWithoutSecret:verifyClaimWithoutSecret
}