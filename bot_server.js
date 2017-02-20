/* Все приватные ключи и прочие токены на доступ к API инкапсулированы в config.js файле.
 Для всех желающих протестировать работу данного приложения предлагаю "захардкодить"
 свои токены ботов и базы данных прямо в этот код { ничего сложного }. */

const TelegramBot = require('node-telegram-bot-api'); // Апишка телеграмм бота
const config = require('./config.json'); // Конфигурационный файл
const token = config.telegramm.token; // Передаем токен из конфиг файла
const admin = require("firebase-admin"); // Апишка для firebase базы данных

const bot = new TelegramBot(token, {polling: true}); //Создаем объект бота

/*Инициализация базы данных*/
admin.initializeApp({
  credential: admin.credential.cert(config.admin),
  databaseURL: "https://telegrammchatbotspa.firebaseio.com"
});

function User() {  // Прототип(?) юзера
}

var questionMassive = ["What is your name?", "What is your surname?", "What is your photo?"], //  Массив с вопросами к юзеру (хардкод, потом исправим)
  i = 0,
  users = [],
  answerMassive = [],
  j = 0;

//Функция поиска пользователя в массиве users по chatId
function findUserByChatId(chatId) {
  for (i = 0; i < users.length; i++) {
    if (users[i].chatId === chatId)
      return users[i];
  }
  return false;
}

// Функция для нового пользователя (пушит его в базу данных)
function dbPush(tabletName, pushed) { // Принимает имя таблицы для пушинга и, собственно, объект для пуша
  const db = admin.database(); //
  const ref = db.ref("/" + tabletName);
  return ref.push(pushed).key;
}

//Функция для существующего пользователя (обновляет существующие данные)
function dbUpdate(refKey, tabletName, pushed) {
  const db = admin.database();
  const ref = db.ref("/" + tabletName + "/" + refKey);
  ref.update(pushed);
}

bot.on('message', function(msg) { // Мэйн
  var
    chatId = msg.chat.id,
    userExist = findUserByChatId(chatId); //ищем пользователя по chatId,полученному из сообщения
  if (msg.text === '/start') {
    if (!userExist) { // если пользователь не существует в массиве,добавляем нового
      var user = new User(); // заполняем поля chatId пользователя, счетчик(counter) и признак добавления в базу(pushed)
      user.chatId = chatId;
      user.counter = 0;
      user.pushed = false;
      users.push(user);
    }
    else { // иначе если пользователь существует в массиве,обнуляем счетчик для перезаписи данных
      userExist.counter = 0;
    }
    bot.sendMessage(chatId, questionMassive[0], {caption: "I'm a bot!"}); // Отправляем первое сообщение-вопрос
    console.log(users);
  }
  else if (userExist) { // Если пользователь уже существует, отправляем вопросы и получаем ответы
    console.log(j);
    switch (userExist.counter) { // присваиваем значения полям пользователя(имя,фамилия,фото)
      case 0:
        userExist.name = msg.text;
        break;
      case 1:
        userExist.surname = msg.text;
        break;
      case 2:
        userExist.photo = msg.photo;
        break;
    }
    userExist.counter++;//увеличиваем счетчик
    if (userExist.counter < questionMassive.length) {
      bot.sendMessage(chatId, questionMassive[userExist.counter], {caption: "I'm a bot!"});//отправка вопроса
      console.log(userExist.counter);
    }
    if (userExist.counter == questionMassive.length) {
      if (userExist.pushed == false) { // Проверяем, запушен юзер в базу или нет. Если нет, то
        userExist.pushed = true; // Присваеваем ему значение pushed = true (типа запушен)
        userExist.refKey = dbPush("users", userExist); // Пушим юзера в базу и присваиваем ему КЛЮЧ (который возвращает функция PUSH) (требуется для дальнейшего обновления)
      } else {
        dbUpdate(userExist.refKey, "users", userExist); //
      }
    }
    console.log(users);
  }
});