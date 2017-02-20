var fs = require('fs');
var url = require('url');
var path = require('path');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = [];
var connections = [];

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + "/"));


server.listen(process.env.PORT || 3000);
console.log("Server running...");

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

//Connection
io.sockets.on('connection', function(socket) {
  connections.push(socket);
  console.log('Connection: %s socket connected', connections.length);

  //Disconnect
  socket.on('disconnect', function(data) {
    if (!socket.username) return;
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });

  //Send Message
  socket.on('send message', function(data) {
    io.sockets.emit('new message', {msg: data});
  });
  
  
  //New User => user будет прилетать из базы данных и улетать через сокет на веб
  //А ещё мы должны отправлять ссылку юзеру на этот самый чат, в котором он уже будет зарегистрирован!!!! Пиздец!!!
  socket.on('bew user', function(data, callback) {
    callback(true);
    socket.username = data;
    users.push(socket, username);
    updateUsernames();
  });
  
  function updateUsernames() {
    io.sockets.emit('get users', usernames);
  }
});

