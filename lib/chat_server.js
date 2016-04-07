/**
 * Created by wuyinxing on 2016/4/6.
 */
var sockitio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currendRoom = {};


exports.listen = function (server) {
    /**
     * 启动socket IO 服务器，允许搭载在已有的HTTP服务器上
     */
    io = sockitio.listen(server);

    io.set('log level',1 );

    /**
     * 当用户连接上时逻辑
     */
    io.sockets.on('connection',function(socket){
        //连接创建用户
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);

        //加入房间
        jionRoom(socket,'Lobby');

        handleMessageBroadcasting(socket,nickNames);

        handleNameChangeAttenots(socket,nickNames,namesUsed);

        handleRoomjoining(socket);

        //用户发出请求时，向其提供被占用的聊天室
        socket.on('rooms',function(){
            socket.emit('rooms',io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket,nickNames,namesUsed);

    });


}

/**
 * 分配昵称
 * @param socket
 * @param guestNumber
 * @param nickNames
 * @param namesUsed
 * @returns {*}
 */
function assignGuestName(socket,guestNumber,nickNames,namesUsed){

    var name = "Guest" + guestNumber;
    //昵称和ID关联
    nickNames[socket.id] = name ;

    socket.emit('nameResult',{
        success:true,
        name :name
    });
    namesUsed.push(name);
    return guestNumber+1;
}

/**
 * 进入聊天室
 * @param socket
 * @param room
 */
function jionRoom(socket,room){
    //进入房间
    socket.join(room);
    //记录房间
    currendRoom[socket.id] = room;
    //让用户知道他进入房间
    socket.emit('joinResult',{room:room});

    //让其他用户知道
    socket.broadcast.to(room).emit('message',{
        text: nickNames[socket.id] + "has joined" + room + '.'
    });
    //确定进入那个房间
    var usersInRoom = io.sockets.clients(room);

    //如果房间布置一个用户汇总
    if(usersInRoom.length > 1){
        var userInRoomSummary = 'User currently in ' + room + ':';
        for(var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index > 0){
                    userInRoomSummary += ",";
                }
                userInRoomSummary += nickNames[userSocketId];
            }
            userInRoomSummary += '.';
            socket.emit('message',{text:userInRoomSummary});
        }
    }

}

/**
 * 修改昵称
 * @param socket
 * @param nikeNames
 * @param namesUsed
 */
function handleNameChangeAttenots(socket,nikeNames,namesUsed){
    socket.on('nameAttempt',function(name){
        if(name.indexOf('Guest') == 0 ){
            socket.emit('nameResult',{
                success:false,
                message:'Names cannot begin with "Guest"'
            });
        }else{
            if(namesUsed.indexOf(name) == -1){
                //取出之前的昵称，并将其替换，然后删除之前的昵称
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nikeNames[socket.id] = name;

                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{success:true,name:name});

                socket.broadcast.to(currendRoom[socket.id]).emit('message',{
                    text:previousName + "is now known as " + name + '.'
                });
            }else{
                socket.emit('nameResult',{
                    success:false,
                    message:'that name is already in use'
                });
            }
        }
    });
}

/**
 * 消息处理转发
 * @param socket
 */
function handleMessageBroadcasting(socket){
    socket.on('message',function(message){
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id] + ":" + message.text
        });
    });
}

/**
 * 创建房间
 * @param socket
 */
function handleRoomjoining(socket){
    socket.on('join',function(room){
        socket.leave(currendRoom[socket.id]);
        jionRoom(socket,room.newRoom);
    });
}

/**
 * 断开连接释放
 * @param socket
 */
function handleClientDisconnection(socket){
    socket.on('disconnect',function(){
        var nameIndex  = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}