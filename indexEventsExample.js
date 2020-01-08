var express = require("express")
var app = express()
var events = require("events")
var eventEmitter = new events.EventEmitter();

// new event handler

eventEmitter.on("welcomeEmail",function(data){
    console.log("First listener was called")
    console.log("welcome email is sent");
    console.log("Email sent to "+data.name+" to the mail "+data.email)
})

app.get("/signup",function(req,res){
    var user = {name:"Aswin",email:"aswin@gmail.com"}
    setTimeout(() => {
        eventEmitter.emit("welcomeEmail",user);
    },2000)
    
    res.send("Hello World!!")
})


app.listen(3000,function(){
    console.log("Example app is running on port 3000")
})