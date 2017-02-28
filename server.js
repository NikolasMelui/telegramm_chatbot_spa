const TelegramBot = require('node-telegram-bot-api'); // Апишка телеграмм бота
const config = require('./config.json'); // Конфигурационный файл
const token = config.telegramm.token; // Передаем токен из конфиг файла
// const admin = require("firebase-admin"); // Апишка для firebase базы данных

const bot = new TelegramBot(token, {polling: true}); //Создаем объект бота

const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

var usersChat = [];
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

  connections.push(socket); // сокеты создаются при заходе на веб-морду (увы)
  console.log('Connection: %s socket connected', connections.length); // кол-во сокетов - для отладки
  io.emit('get users', usersChat); // смотрим кол-во юзеров в чате

  socket.on('disconnect', function(data) {
    connections.splice(connections.indexOf(socket), 1);
    console.log('Connection: %s socket connected', connections.length);
  });

});

function User() {
}

var questionMassive = ["Как тебя зовут?", "Какая у тебя фамилия?", "Отправь мне своё фото, пожалуйста ))"],
  i = 0,
  j = 0;

function findUserByChatId(chatId) {
  for (i = 0; i < usersChat.length; i++) {
    if (usersChat[i].chatId === chatId)
      return usersChat[i];
  }
  return false;
}
bot.on('message', function(msg) {
  var chatId = msg.chat.id;
  var userExist = findUserByChatId(chatId);
  if (msg.text === '/start') {
    if (!userExist) {
      var user = new User();
      user.chatId = chatId;
      user.counter = 0;
      usersChat.push(user);
    } else {
      userExist.counter = 0;
      userExist.chatId = chatId;
    }
    bot.sendMessage(chatId, "Привет, добро пожаловать в наше скромное приложение) Ответь, пожалуйста, на несколько вопросов, тогда я смогу пригласить тебя в приватный чат для избранных ;D");
    setTimeout(bot.sendMessage(chatId, questionMassive[0]), 2000);
    console.log(usersChat);
  }
  else if (userExist) {
    console.log(j);
    switch (userExist.counter) {
      case 0:
        userExist.name = msg.text;
        break;
      case 1:
        userExist.surname = msg.text;
        break;
      case 2: 
        if(msg.photo) { 
          bot.getFileLink(msg.photo[0].file_id).then( 
          resolve => { 
          // первая функция-обработчик - запустится при вызове resolve 
          userExist.photo = resolve; 
          console.log(userExist); 
          }, 
          reject => { 
          // вторая функция - запустится при вызове reject 
          userExist.photo =reject; // error - аргумент reject 
          console.log(userExist); 
          } ); 
          } else { 
          bot.sendMessage(chatId, "Это не похоже на фото, попробуй ещё разок!"); 
          userExist.counter--; 
          } 
        break;
    }
    userExist.counter++;
    if (userExist.counter < questionMassive.length) {
      bot.sendMessage(chatId, questionMassive[userExist.counter]);
      console.log(userExist.counter);
    }
    if (userExist.counter == questionMassive.length) {
      if (usersChat.indexOf(userExist)) {
        io.emit('get users', usersChat);
      }
      bot.sendMessage(chatId, "Отлично, я зарегистрировал тебя в нашем чате, вот тебе ссылочка: " + "https://calm-shore-72270.herokuapp.com/");
    }
    io.emit('get users', usersChat);
    if (userExist.counter > questionMassive.length) {
      var curDate = new Date().getHours() + ':' + new Date().getMinutes();
      userExist.lastmsgtime = curDate;
      io.emit('new message', {msg: msg.text, user: userExist.name + ' ' + userExist.surname, lastmsgtime: userExist.lastmsgtime, photo: userExist.photo, id: userExist.chatId });
      userExist.lastmsg = msg.text;
      io.emit('get users', usersChat); 
    }
    console.log(usersChat);
  }
});

// /*Инициализация базы данных*/
// admin.initializeApp({
//   credential: admin.credential.cert(config.admin),
//   databaseURL: "https://telegrammchatbotspa.firebaseio.com"
// });

// // Функция для нового пользователя (пушит его в базу данных)
// function dbPush(tabletName, pushed) { // Принимает имя таблицы для пушинга и, собственно, объект для пуша
//   const db = admin.database(); //
//   const ref = db.ref("/" + tabletName);
//   return ref.push(pushed).key;
// }

// //Функция для существующего пользователя (обновляет существующие данные)
// function dbUpdate(refKey, tabletName, pushed) {
//   const db = admin.database();
//   const ref = db.ref("/" + tabletName + "/" + refKey);
//   ref.update(pushed);
// }