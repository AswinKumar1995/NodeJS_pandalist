//connecting with the sockets

const socket = io('http://localhost:3000');
const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RpZCI6IjFteGhDX1JCIiwiaWF0IjoxNTcxOTg2ODYzOTA5LCJleHAiOjE1NzIwNzMyNjMsInN1YiI6ImF1dGhUb2tlbiIsImlzcyI6ImVkQ2hhdCIsImRhdGEiOnsidXNlcklkIjoiVHdUZG5IbjMiLCJmaXJzdE5hbWUiOiJwYWRtYSIsImxhc3ROYW1lIjoidmF0aGkiLCJlbWFpbCI6InBhZG1hQGdtYWlsLmNvbSIsIm1vYmlsZU51bWJlciI6MzQ1NTYyMjI1NH19.ltHK3WbP2ZxFhj30lQ9Y5FZ_mEbBh9MZYch_bvd_JFU"
const userId = "TwTdnHn3"

let chatMessage = {
    createdOn: Date.now(),
    receiverId: "rOaXzy0D",
    receiverName: "Mr Mallesh",
    senderId: userId,
    senderName: "Mrs Padma"
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
        socket.emit("typing","Mrs Padma")
     })

    socket.on("typing",(data) => {
        console.log(data+" is typing")
    })
}

chatSocket()