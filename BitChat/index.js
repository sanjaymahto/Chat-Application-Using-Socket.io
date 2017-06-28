var app = require('express')();
var session = require('express-session');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var UserChat = require('./UserChat.js');
var userChatModel = mongoose.model('UserChat')
// path is used the get the path of our files on the computer
var path = require('path');

// set the templating engine 
app.set('view engine', 'jade');

//set the views folder
app.set('views', path.join(__dirname + '/app/views'));



//For data base connectivity....
var dbPath  = "mongodb://localhost/chatDatabase";

// command to connect with database
db = mongoose.connect(dbPath);
mongoose.connection.once('open', function() {
  console.log("database connection open success");
});

//localhost...
 app.get('/', function (req, res) {

 	 userChatModel.find().sort({date: -1}).limit(10).exec(function(err, result){
            if(err){
               res.render('404', {
                        message: "Unable to connect to DataBase...",
                        error: "Error in database..."
                    });
            }
            else{
            	if(result.length == 0)
            	{
            		res.render('index',{
            			chats:result,
            			nochat:"There is no chat in Database..."
            		})
            	}
                console.log(result);
                  res.render('index',{
                  	chats: result
              });
              
            }
        });// end find
       
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


io.on('connection', function(socket){

  socket.on('user',function(data){
    socket.user = data;
    console.log(data+ " is online");
    socket.broadcast.emit('chat message', data+" is online");
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

app.use(function (err, req, res) {
	console.log(err.status);
    //res.status(err.status || 500);
    if (err.status == 404) {
        res.render('404', {
            message: err.message,
            error: err
        });
    } else {
        res.render('404', {
            message: err.message,
            error: err
        });
    }
});


http.listen(3000, function(){
  console.log('listening on port:3000');
});
