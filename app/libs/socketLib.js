const socketio = require("socket.io")
const mongoose = require("mongoose")
const shortid = require("shortid")
const logger = require("./../libs/loggerLib")
const events = require("events")
const eventEmitter = new events.EventEmitter();
const tokenLib = require("./../libs/tokenLib")
const check = require("./../libs/checkLib")
const reponse = require("./../libs/responseLib")
const ChatModel = mongoose.model("Chat")
const redisLib = require("../libs/redisLib")

let setServer = (server) => {
   // let allOnlineUser = [];
    let io = socketio.listen(server);
    let myIo = io.of("")
     
    myIo.on('connection',(socket) => {
        console.log("on connection emitting verify-user event");
        socket.emit("verifyUser","")
        socket.on("set-user",(authToken) => {
            console.log("set-user called")
            tokenLib.verifyClaimWithoutSecret(authToken,(err,user) => {
                if(err){
                    socket.emit("auth-error",{status:500,error:"Please provide correct token"})
                }
                else {
                    console.log("user is verified... setting details")
                    let currentUser = user.data;
                    socket.userId = currentUser.userId;
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`
                    console.log(`${fullName} is online`)
                    //socket.emit(currentUser.userId,"Your are online")
                    //connecting to redis databse to save online users

                    let key = currentUser.userId
                    let value = fullName

                    let setUserOnline = redisLib.setANewOnlineUserInHash("onlineUsers",key,value,(err,result) => {
                        if(err){
                            console.log("some error occured")
                        }
                        else {
                            redisLib.getAllUserInAHash("onlineUsers",(err,result) => {
                                console.log("--inside getAll users in Hash function")
                                if(err){
                                    console.log(err)
                                }
                                else{
                                    console.log(`${fullName} is online`)
                                    socket.rooms = "edChat"
                                    socket.join(socket.rooms)
                                    socket.to(socket.rooms).broadcast.emit("online-user-list",result);
                                    console.log(result)

                                }
                            })
                        }
                    })
                    // let userObj = {userId:currentUser.userId,fullName:fullName}
                    // allOnlineUser.push(userObj)
                    // console.log(allOnlineUser)

                    // //setting room name

                    // socket.rooms = "edChat"
                    // // joing chat group
                    // socket.join(socket.rooms)
                    // socket.to(socket.rooms).broadcast.emit("online-user-list",allOnlineUser);
                }
            })
            
        })
        // end of set user event listening
        socket.on("disconnect",() => {
            console.log("user is disconnected");
            console.log(socket.userId);
            //deleting the current user from all online user list
            // var removeIndex = allOnlineUser.map(function(user) {return user.userId}).indexOf(socket.userId);
            // allOnlineUser.splice(removeIndex,1);
            // console.log(allOnlineUser);
            // socket.to(socket.rooms).broadcast.emit("online-user-list",allOnlineUser);
            // socket.leave(socket.rooms)

            //removing user from redis database and updating online list
            if(socket.userId){
                redisLib.deleteUserFromHash("onlineUsers",socket.userId)
                redisLib.getAllUserInAHash("onlineUsers",(err,result) => {
                    if(err){
                        console.log(err)
                    }
                    else{
                        socket.leave(socket.rooms)
                        socket.to(socket.rooms).broadcast.emit('online-user-list', result);
                        console.log(result)
                    }
                })
            }

        })

        socket.on("chat-msg",(data) => {
            console.log("socket chat-msg called")
            console.log(data)
            data["chatId"] = shortid.generate()
            console.log(data)
            //event to save the chats
            setTimeout( function (){
                eventEmitter.emit("save-chat",data)
            },2000)
            
            myIo.emit(data.receiverId,data)
        })

        socket.on("typing",(fullName) => {
            socket.to(socket.rooms).broadcast.emit("typing",fullName)
        })
    })
}
 // saving chats to database
eventEmitter.on('save-chat',(data) => {
    let newChat = new ChatModel({
        chatId : data.chatId,
        senderName : data.senderName,
        senderId : data.senderId,
        receiverName : data.receiverName,
        receiverId:data.receiverId,
        message:data.message,
        chatRoom:data.chatRoom || "",
        createdOn:data.createdOn
    })
    newChat.save((err,result) => {
        if(err){
            console.log(`Error occured : ${err}`)
        }
        else if (result == undefined || result == null || result == "") {
            console.log("Chat is not saved.")
        }
        else {
            console.log("Chat is Saved");
            console.log(result)
        }
    })
})

module.exports = {
    setServer:setServer
}