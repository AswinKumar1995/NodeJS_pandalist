const mongoose = require("mongoose")
const shortid = require("shortid")
const time = require("./../libs/timeLib")
const passwordLib = require("./../libs/generatePasswordLib")
const response = require("./../libs/responseLib")
const logger = require("./../libs/loggerLib")
const validateInput = require("../libs/paramsValidationLib")
const check = require("../libs/checkLib")
const token = require("../libs/tokenLib")
const ChatModel = mongoose.model("Chat")
const UserModel = mongoose.model("User")
const AuthModel = mongoose.model("Auth")
const TaskModel = mongoose.model('Task')


let getAllTaskByUser = (req,res) => {
    TaskModel.find({'assigneeId':req.params.userId})
        .select('-__v -_id')
        .lean()
        .exec((err,result) => {
            if(err) {
                logger.error(err.message,"TaskController:getAllTaskByUser",10)
                let apiResponse = response.generate(true,"Failed to get task Details",500,null)
                res.send(apiResponse)
            }
            else if(check.isEmpty(result)){
                console.log("No Task Found")
                logger.info("No Task Found","TaskController: getAllTaskByUser",10)
                let apiResponse = response.generate(true,"No Task Found",404,null)
                res.send(apiResponse)
            }
            else{
                let apiResponse = response.generate(false,"All Task Details Found",200,result)
                res.send(apiResponse)
            }
        })
}


let editTask = (req,res) => {
    let options = req.body;
    console.log(options)
    TaskModel.update({'taskId':req.params.taskId},options,{multi:true}).exec((err,result) => {
        if(err) {
            console.log(err);
            let apiResponse = response.generate(true,"Error Occured",500,null)
            res.send(apiResponse)
        }

        else if(check.isEmpty(result)){
            console.log("No Ticket Found")
            let apiResponse = response.generate(true,"No Task Found",404,null)
            res.send(apiResponse)
        }
        else{
            res.send(result)
        }
    })
}


let createTask = (req,res) => {
    var today = time.now()
    let taskid = shortid.generate();
    let newTask = new TaskModel({
        taskId:taskId,
        title:req.body.title,
        status:req.body.status,
        subtaskFlag:req.body.subtaskFlag,
        parentTaskId:req.body.parentTaskId,
        assigneeId:req.body.assigneeId,
        reporterId:req.body.reporterId,
        createdOn:today,
        modifiedOn:today
    })

    newTask.save((err,result) => {
        if(err){
            console.log(err);
            res.send(err);
        }
        else{
            res.send(result)
        }
    })
}


let deleteTask = (req,res) => {
    TaskModel.findOneAndRemove({'assigneeId':req.params.taskId}).exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Task Controller: deleteTask', 10)
            let apiResponse = response.generate(true, 'Failed To delete user', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No Task Found', 'Task Controller: deleteTask',10)
            let apiResponse = response.generate(true, 'No Task Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Deleted the task successfully', 200, result)
            res.send(apiResponse)
        }
    })
}

module.exports = {
    getAllTaskByUser:getAllTaskByUser,
    deleteTask:deleteTask,
    editTask:editTask,
    createTask:createTask
}

















