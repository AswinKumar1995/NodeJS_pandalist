const check = require("../libs/checkLib")
const redis = require("redis")
let client = redis.createClient(10690, 'redis-10690.c10.us-east-1-2.ec2.cloud.redislabs.com', {no_ready_check: true});
client.auth('Evgg5HKDoklXhdOPHKCA9PiYC0177KY0', function (err) {
    if (err) throw err;
});

client.on('connect', function() {
    console.log('Connected to Redis');
});

let getAllUserInAHash = (hashName,callback) => {
    client.HGETALL(hashName,(err,result) => {
        console.log(`Getting all online users for hash ${hashName}`)
        if(err) {
            console.log(err)
            callback(err,null)
        }
        else if (check.isEmpty(result)) {
            console.log("online user list is empty")
            console.log(result)
            callback(null,{})
        }
        else {
            console.log(result)
            callback(null,result)
        }
    })
}


let setANewOnlineUserInHash = (hashName,key,value,callback) => {
    client.HMSET(hashName,[key,value],(err,result) => {
        if(err){
            console.log(err)
            callback(err,null)
        }
        else {
            console.log("user has been set in the hash map")
            console.log(result)
            callback(null,result)
        }
    })
}


let deleteUserFromHash = (hashName,key) => {
    client.HDEL(hashName,key);
    return true
}

module.exports = {
    getAllUserInAHash:getAllUserInAHash,
    setANewOnlineUserInHash:setANewOnlineUserInHash,
    deleteUserFromHash:deleteUserFromHash
}

