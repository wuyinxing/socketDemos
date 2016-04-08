/**
 * Created by wuyinxing on 2016/4/6.
 */

var http =  require('http');
var fs   =  require('fs');
var mime =  require('mime');
var path =  require('path');
var cache = {};


/**
 * http serverchatServer
 */
var server = http.createServer(function (request,response) {
    var filePath = false ;
        if(request.url == '/'){
        filePath = 'public/index.html';   //默认返回HTML
    }else{
        filePath = 'public' + request.url;  //转换成相应的URL
    }
    var absPath = './' + filePath;
    serveStatic(response,cache,absPath);
});
server.listen(3000,function(){
    console.log('server listening on port 3000');
});

// chat server
var chatServer = require("./lib/chat_server");
chatServer.listen(server);

/**
 * 资源文件404错误
 * @param response
 */
function send404(response){
    response.writeHead(404,{'Content-Type':'text/plan'});
    response.write('Error 404 : rsource not found');
    response.end();
}

/**
 * 文件数据服务
 * @param response
 * @param filePath
 * @param fileContents
 */
function sendFile(response,filePath,fileContents){
    response.writeHead(200,mime.lookup(path.basename(filePath)));
    response.end(fileContents);
}


/**
 * 读取静态资源
 * @param response
 * @param cache
 * @param absPath
 */
function serveStatic(response,cache,absPath){
    //先读取缓存
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath]);
    }else{
        //检查文件是否存在
        fs.exists(absPath,function(exists){
            if(exists){
                //文件存在读取并存储在cache中
                fs.readFile(absPath,function(err,data){
                    if(err) {
                        send404(response);
                    }else{
                        cache[absPath] = data;
                        sendFile(response,absPath,data);
                    }
                });
            }else{
                send404(response);//文件不存在返回404
            }
        });
    }
}