/**
 * Created by wuyinxing on 2016/4/6.
 */


var socket = io.connect();

$(document).ready(function(){

    var chatApp = new Chat(socket);

    socket.on('nameResult',function(result){
        var message ;

        if(result.message){
            message = 'You are known as ' + result.message + '.';
        }else{
            message = result.name;
        }

        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function (result) {
        //$('#room-list').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed'));
    });

    socket.on('message',function(message){
        var newElemet = $('<div></div>').text(message.text);
        $('#messages').append(newElemet);
    });

    socket.on('rooms', function (rooms) {
        $('#room-list').empty();

        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room != '') {
                $('#room-list').append(divEscapedContentElement(room));
            }
        }
        //点击房间名切换
        $('#room-list div').click(function(){
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    //定期请求房间
    setInterval(function(){
        socket.emit('rooms');
    },1000);

    $('#send-message').focus();

    $('#send-form').submit(function(){
        processUserInput(chatApp,socket);
        return false;
    });

});

/**
 * 处理可疑文本数据
 * @param message
 * @returns {*|jQuery}
 */
function divEscapedContentElement(message){
    return $('<div></div>').text(message);
}

/**
 * 系统受信任文件
 * @param message
 * @returns {*|jQuery}
 */
function divSystemContentElement(message){
    return  $('<div></div>').html('<i>'+message+'</i>');
}


/**
 * 处理input数据，如果‘/’则表示命令，如果不是则当做消息
 * @param chatApp
 * @param socket
 */
function processUserInput(chatApp,socket){
    var message = $('#send-message').val();
    var systemMessage ;
    if(message.charAt(0) == '/'){
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $("#messages").append(divSystemContentElement(message));
        }
    }else{
        chatApp.sendMessage($('#room').text(),message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}
