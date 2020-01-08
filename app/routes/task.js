const express = require("express");
const router = express.Router()

const taskController = require("./../controllers/taskController")

const appConfig = require("./../../config/appConfig")

let setRouter = (app) => { 
    let baseUrl = appConfig.apiVersion + "/tasks";
    app.get(`${baseUrl}/:userId/all`,taskController.getAllTaskByUser);
    app.get(`${baseUrl}/:taskId/edit`,taskController.editTask);
    app.get(`${baseUrl}/create`,taskController.createTask);
    app.get(`${baseUrl}/:taskId/delete`,taskController.deleteTask);
}

module.exports = {
    setRouter:setRouter
}