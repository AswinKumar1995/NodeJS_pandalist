//connecting with the sockets

const socket = io('http://localhost:3000');
const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RpZCI6IkU4aHk4amRiIiwiaWF0IjoxNTcxOTg2OTYwMDI1LCJleHAiOjE1NzIwNzMzNjAsInN1YiI6ImF1dGhUb2tlbiIsImlzcyI6ImVkQ2hhdCIsImRhdGEiOnsidXNlcklkIjoick9hWHp5MEQiLCJmaXJzdE5hbWUiOiJtYWxsZXNoIiwibGFzdE5hbWUiOiJLdW1hciIsImVtYWlsIjoibWFsbGVzaEBnbWFpbC5jb20iLCJtb2JpbGVOdW1iZXIiOjM0NTU2MjIyNTR9fQ.WMkRshOARGKEbc7OZpdySWPHLkqWuUmfXR9A4Y2kV5A"
const userId = "rOaXzy0D"

let chatMessage = {
    createdOn: Date.now(),
    receiverId: "TwTdnHn3",
    receiverName: "Mrs Padma",
    senderId: userId,
    senderName: "Mr Mallesh"
}

let chatSocket = () => {
    socket.on("verifyUser", (data) => {
        console.log("scoket trying to verify user");
        socket.emit("set-user", authToken)

    })
    socket.on(userId, (data) => {
        console.log("you received a message from " + data.senderName);
        console.log(data.message)
    })
    //printing online user list
    socket.on("online-user-list", (data) => {
        console.log(" Online user list is updated. Some users can went online or offline")
        console.log(data)
    })

    $("#send").on('click', function () {
        let messageText = $("#messageToSend").val()
        chatMessage.message = messageText;
        socket.emit("chat-msg", chatMessage)
    })

    $("#messageToSend").on('keypress', function () { 
        socket.emit("typing","Mr Mallesh")
     })

    socket.on("typing",(data) => {
        console.log(data+" is typing")
    })
}

chatSocket()