const mongoose = require('mongoose')
const Schema = mongoose.Schema

let taskSchema = new Schema({
    taskId:{type:String,unique:true,required:true},
    title:{type:String,required:true,default:''},
    status : {type:String,required:true,default:''},
    subtaskFlag:{type:Boolean,default:false},
    parentTaskId:{type:String,default:''},
    assigneeId:{type:String,required:true,default:''},
    reporterId:{type:String,required:true,default:''},
    createdOn:{type:Date,default:Date.now},
    modifiedOn:{type:Date,default:Date.now}
})

mongoose.model('Task',taskSchema)