const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.json');
const token = config.telegramm.token;
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/echo (.+)/, function(msg, match) {
  var fromId = msg.from.id;
  var resp = match[1];
  bot.sendMessage(fromId, resp);
});

var notes = [];

bot.onText(/\/напомни (.+) в (.+)/, function(msg, match) {
  var userId = msg.from.id; // ID пользователя который прислал сообщение.
  var text = match[1]; // текст. Его бот вернёт в указанное время.
  var time = match[2]; // время, в которое придёт напоминание.
  
  notes.push({'uid': userId, 'time': time, 'text': text});
  
  bot.sendMessage(userId, 'Я ничего не обещаю, но если я буду тут, обязательно напомнию!');
});

setInterval(function() {
  for (var i = 0; i < notes.length; i++) {
    var curDate = new Date().getHours() + ':' + new Date().getMinutes();
    if (notes[i]['time'] == curDate) {
      bot.sendMessage(notes[i]['uid'], 'Эй, ты просил напомнить, что ' + notes[i]['text'] + ' ты собирался сделать прямо сейчас!');
      notes.splice(i, 1);
    }
  }
}, 1000);
