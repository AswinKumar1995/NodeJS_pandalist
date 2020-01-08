const response = require("./../libs/responseLib")


let errorHandler = (err,req,res,next) => {
    console.log("Application error Handled")
    console.log(err)
    let apiResponse = response.generate(true,"Some error ocurred at global level",500,null)
    res.send(apiResponse)
}


let notFoundHandler = (req,res,next) => {
    console.log("Global Not found handler")
    let apiResponse = response.generate(true,"Route not Found in application",404,null)
    res.status(404).send(apiResponse)
} // end notfoundhandler


module.exports = {
    globalErrorHandler:errorHandler,
    globalNotFoundHandler:notFoundHandler
}