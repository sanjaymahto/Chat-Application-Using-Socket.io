var app = require('express')();
var session = require('express-session');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var UserChat = require('./UserChat.js');
var userChatModel = mongoose.model('UserChat')


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
//});


//For data base connectivity....
var dbPath  = "mongodb://localhost/chatDab";

// command to connect with database
db = mongoose.connect(dbPath);
mongoose.connection.once('open', function() {
  console.log("database connection open success");
});
 
 //to store the cookies...
app.use(session({
    name: 'myCustomCookie',
    secret: 'myAppSecret', // encryption key 
    resave: true,
    httpOnly: true, //used for  mitigating cookie frauds...
    saveUninitialized: true,
    cookie: {
        secure: true
    }
}));

});

 session.userName = null;

io.on('connection', function(socket){


  socket.on('user',function(data){
    socket.user = data;
    console.log(data+ " is online");
    socket.broadcast.emit('chat message', data+" is online");
if(session.userName == null || session.userName != data)
{
	session.userName = data;
 userChatModel.find().sort({date: -1}).limit(10).exec(function(err, result){
            if(err){
               io.emit('chat message', "sorry! Database connectivity Error...");
            }
            else{
                console.log(result.message);
                for (var i = result.length - 1; i >= 0; i--) {
                  console.log(result[i].message);
                  io.emit('chat message', result[i].message+' Submitted on: '+result[i].date.toDateString());
              }
            }

        });// end find

}
    // you can allocate variables in socket.
  });

  

  socket.on('chat message', function(msg){
          console.log(msg);
         var newChat = new userChatModel({
            date    : new Date(),
            message : socket.user+" : "+msg
            });// end new chat...

          
             newChat.save(function(err){
                if(err){
                console.log("there is error in saving the records...");
                }
                else{
                  console.log(newChat);
                }

            });//end new user save
    io.emit('chat message', socket.user+' : '+msg +'|| Submitted on: '+new Date().toDateString());
   });

socket.on('message', function(msg){
    io.emit('message', msg);

  });

  //on typing event...
  socket.on('typing', function(data) {
  //console.log(data);
    if (data == false) {
       socket.broadcast.emit('message', ''); 
    } else {
        socket.broadcast.emit('message', socket.user+" is typing..."); 
    }
});

//Code when user disconnects
  socket.on('disconnect',function(){
  	 console.log(socket.user+" left the chat");
  	 socket.status = 0;
     socket.broadcast.emit('chat message', socket.user+" left the chat");
     	//req.session.destroy();
  }); //end socket disconnected

});

http.listen(3000, function(){
  console.log('listening on port:3000');
});
