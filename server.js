const TelegramBot = require('node-telegram-bot-api'); // Апишка телеграмм бота
const config = require('./config.json'); // Конфигурационный файл
const token = config.telegramm.token; // Передаем токен из конфиг файла
// const admin = require("firebase-admin"); // Апишка для firebase базы данных

const bot = new TelegramBot(token, {polling: true}); //Создаем объект бота

//Реквайрим модули
const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

var connections = [], // Массив сокетов, которые взаимодействуют с чатом (т.е. полность прошли этап регистрации и вошли на веб-морду чата)
    usersChat = [], // Массив юзеров, которые зарегистрированы в чате
    questionMassive = ["Как тебя зовут?", "Какая у тебя фамилия?", "Отправь мне своё фото, пожалуйста ))" ],
    chatMessages = [], // Массив объектов последних 10 сообщений юзеров
    userExist; // Абстрактный персонаж, который будет записан в массив юзеров

var last_msg_chatId_new,
    last_msg_chatId_one,
    last_msg_chatId_two,
    last_msg_color;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + "/"));

server.listen(process.env.PORT || 3000);
console.log("Server running...");

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});


function User() {} // Прототип юзера, в которого мы будем писать и с которым будем работать

function findUserByChatId(chatId) {
  for (var i = 0; i < usersChat.length; i++) {
    if (usersChat[i].chatId === chatId)
      return usersChat[i];
  }
  return false;
}

bot.on('message', function(msg) {
  var chatId = msg.chat.id;
  userExist = findUserByChatId(chatId);
  
  // bot.sendMessage(chatId, "Привет, чтобы начать взаимодействовать со мной, напиши мне команду /start");
  // TODO: Не работает, починить!

  if (msg.text === '/start') { // Начинаем взаимоействовать с ботом
    if (!userExist) { // Если такого юзера ещё не существет (проверяем по ChatId)
      var user = new User(); // Создаем нового юзера и присваиваем ему
      user.chatId = chatId; // Его айдишник
      user.counter = 0; // Счетчик вопросов, на которые он ответил (изначально 0)
      usersChat.push(user); // И пушим нового юзера в массив юзеров 
      /*TODO: Вот тут бы по хорошему надо написать первую половину инициализации создания СОКЕТА
        Что-то в стиле...

        user.socetCreatePatrOne = true; 

        */
    } else { // Иначе для уже существующего юзера повторяем процесс регистрации в чате (всего взимодействия) с самого начала
      userExist.counter = 0; // Обнуляем счетчик вопросов, на которые он ответил
      userExist.chatId = chatId; // Обновляем его айдишник
      //TODO: А, кстати, зачем? Он же не меняется никогда вроде! Думаю надо убрать...
    }
    bot.sendMessage(chatId, "Добро пожаловать в наше скромное приложение) Ответь, пожалуйста, на несколько вопросов, тогда я смогу пригласить тебя в приватный чат для избранных ;D"); // Пишем юзеро первое письмо с приветствием и инструкциями как и что ему делать
    bot.sendMessage(chatId, questionMassive[0]); // И начинаем ему задавать вопросы
    //TODO: НЕ РАБОТАЕТ таймер задержки. Починить!
  }
  else if (userExist) { // Дальше вся логика основана на ЮзерЭкзисте, т.е. если и правда такой юзер есть...
    //TODO: Хреново это, статическая итеративная залупа. Я бы убрал на юзера, просто ИСТИНУ где-нибудь выше повесил и всё на объект лепил бы...
    switch (userExist.counter) { // Начинаем задавать вопросы юзеру
      case 0:
        userExist.name = msg.text; // Спрашиваем имя и записываем в объект
        break;
      case 1:
        userExist.surname = msg.text; // Спрашиваем фамилию и записываем в объект
        break;
      case 2: 
        if(msg.photo) { // А вот тут всё сложно! Чё написал? Хер пойми... работает и ладно)
        
          //TODO: РАЗОБРАТЬСЯ!!! 

          bot.getFileLink(msg.photo[0].file_id).then( 
            resolve => { 
              // первая функция-обработчик - запустится при вызове resolve 
              userExist.photo = resolve; 
            }, 
            reject => { 
              // вторая функция - запустится при вызове reject 
              userExist.photo =reject; // error - аргумент reject 
            }
          ); 
          } else { 
            bot.sendMessage(chatId, "Это не похоже на фото, попробуй ещё разок!"); 
            userExist.counter--; 
          }
        break;
    }
    userExist.counter++; // Ответил на вопросы, итерируем счетчик вопросов
    if (userExist.counter < questionMassive.length) {  // Если по какой-то причине юзер не ответил ещё на все вопросы
      bot.sendMessage(chatId, questionMassive[userExist.counter]); // Задать следующий вопрос, который идёт по списку... и так по кругу, пока на все вопросы ответов не поступит
    }
    if (userExist.counter == questionMassive.length) { // Если юзер ответил на все вопросы   
      // TODO: А что делает эта хрень? Разобраться!      
      if (usersChat.indexOf(userExist)) {
        io.sockets.emit('get users', usersChat);
      }
      bot.sendMessage(chatId, "Отлично, я зарегистрировал тебя в нашем чате, вот тебе ссылочка: " + "https://calm-shore-72270.herokuapp.com/?"+ "id="+userExist.chatId);
    }
    io.sockets.emit('get users', usersChat);    
    if (userExist.counter > questionMassive.length) { // Если процесс регистрации завершен и юзер получил доступ в чат
      bot.sendMessage(chatId, "Теперь пиши сообщения в чат, я свою работу сделал)"); // Чтобы он шёл писать в чат, потому что бот уже выполнил свою программу и устал от него ;D
    }
  }
});

/*
  Дальше танцы с бубном и сложная логика пересыла информации и возбуждения событий  
*/
//Connection
io.sockets.on('connection', function(socket) { // При заходе на веб-морду создается соединение

  connections.push(socket); // порожденный веб-мордой сокет порождает СОКЕТ кладет его в массив сокетов
  io.sockets.emit('get users', usersChat); // Показывает всех юзеров, зарегистрированных в чате
  socket.emit('get messages', chatMessages); // Показывает последние 10 сообщений
  //TODO: Но не всем же! Зачем 10 сообщений тому, кто только что вошёл? Сделать проверку!
  // TODO: Выведем сообщение в чат ЮЗЕР ***-n ВОШЕЛ
  console.log('Connection: %s socket connected', connections.length); // кол-во сокетов - для отладки
  
  socket.on('disconnect', function(data) {
    //TODO: А вот сюда добавим проверку на кнопку ВЫЙТИ, которая будет на фронте. Будем её слушать!
    connections.splice(connections.indexOf(socket), 1);
    io.sockets.emit('get users', usersChat);
    // userChat.splice(userChat.indexOf(socket), 1);
    console.log('Connection: %s socket connected', connections.length);
    // TODO: Выведем сообщение в чат ЮЗЕР ***-n ВЫШЕЛ
  });

  var userWebId; // Переменная для айдишника с фронта 

  socket.on('send userWebId', function(data) { // Принимает с фронта айдишник последнего отправившего сообщение
    userWebId = data;
  });

  socket.on('send message', function(data) { // При нажатии на кнопку ОТПРАВИТЬ СООБЩЕНИЕ
    for (var i = 0; i < usersChat.length; i++) { // Бежит по массиву юзеров бэка
      if(usersChat[i].chatId == userWebId) { // И сравнивает айдишник с фронта со всеми в массиве

      last_msg_chatId_new = userWebId;

      if (((last_msg_chatId_one == undefined) && (last_msg_chatId_two == undefined)) || (last_msg_chatId_new == last_msg_chatId_one)) {
        last_msg_chatId_one = last_msg_chatId_new;
        last_msg_color = 'white_msg_color';
      } else if (((last_msg_chatId_new != last_msg_chatId_one) && (last_msg_chatId_one != undefined)) || (last_msg_chatId_new == last_msg_chatId_two)) {
        last_msg_chatId_two = last_msg_chatId_new;
        last_msg_color = 'blue_msg_color';
      } else if (((last_msg_chatId_new != last_msg_chatId_one) && (last_msg_chatId_new != last_msg_chatId_one)) && ((last_msg_chatId_one != undefined) && (last_msg_chatId_two != undefined))) {
        last_msg_chatId_one = last_msg_chatId_new;
        last_msg_color = 'white_msg_color';
      }

      usersChat[i].last_msg = data;

      var last_msg_time_hours = new Date().getHours();
      if(last_msg_time_hours < 10) last_msg_time_hours = '0' + last_msg_time_hours;
      
      var last_msg_time_minutes = new Date().getMinutes();
      if(last_msg_time_minutes < 10) last_msg_time_minutes = '0' + last_msg_time_minutes;
      
      usersChat[i].last_msg_time = last_msg_time_hours + ':' + last_msg_time_minutes;
      
      usersChat[i].time = new Date().getTime();
      
      usersChat[i].last_msg_timer;
      
      io.sockets.emit('new message', { msg: data, last_msg_color: last_msg_color, user: usersChat[i].name + ' ' + usersChat[i].surname, photo: usersChat[i].photo, last_msg: usersChat[i].last_msg, last_msg_time: usersChat[i].last_msg_time, last_msg_timer: usersChat[i].last_msg_timer }); //При совпадении возбуждается событие отправления сообщения в чат от лица нужного нам юзера
      io.sockets.emit('get users', usersChat);  
      chatMessages.push({ msg: data, last_msg_color: last_msg_color, user: usersChat[i].name + ' ' + usersChat[i].surname, photo: usersChat[i].photo, last_msg: usersChat[i].last_msg, last_msg_time: usersChat[i].last_msg_time, last_msg_timer: usersChat[i].last_msg_timer });
      }
    }
  });

  //new
  var start_time_interval = setInterval(function() {
    for (var j = 0; j < usersChat.length; j++) {
          usersChat[j].cur_time = new Date().getTime();
          usersChat[j].timer = usersChat[j].cur_time-usersChat[j].time;
      }
        io.sockets.emit('get users', usersChat);
      },1000);
  
});



/* Пока нет приминения базе данных, но всё готово для её внедрения в проект */

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