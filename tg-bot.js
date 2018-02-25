var TelegramBot = require('node-telegram-bot-api');
var request = require('request');
var fs      = require('fs');
var mkdirp = require('mkdirp');

const TOKEN ='549819746:AAHrHrlREF6uRSIRcLPCs9upjYK7ggCMc6I';
const { exec } = require('child_process');

var isDeletingMode = false;
var botOptions = { polling: true };
var bot = new TelegramBot(TOKEN, botOptions);
var waitingPhoto = false;

var options = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Показать все', callback_data: 'data 1' }, { text: 'Удалить', callback_data: 'data 2' }]
      ]
    })
  };

bot.on('message', function(msg) {
    // console.log("msg.text >", msg.caption);
    // console.log('msg.photo>', msg.photo);
    var messageChatId = msg.chat.id;    
    var messageText = msg.text;
    var idUser = msg.from.id;

    if (msg.photo !== undefined) {
        var leng = msg.photo.length - parseInt(1); // max размер
        var str = "https://api.telegram.org/bot"+TOKEN+"/getfile?file_id="+msg.photo[leng].file_id;
        request(str, function (error, response, body) {
            var body_ = JSON.parse(body)
            var path_ = body_.result.file_path
            var str_ = "https://api.telegram.org/file/bot"+TOKEN+"/"+path_;
            var t = path_.split("/")
            var url_img = "img/"+idUser+"/"+t[1]; //путь до фото
            var dir = "img/"+idUser; //папка

            request.get({url: str_, encoding: 'binary'}, function (err, response, body) {
                if (!fs.existsSync(dir)) {
                    mkdirp(dir, function (err) {
                        if (err) console.error(err)
                        else {
                            Creattt(url_img,body,messageChatId)
                        }
                    });
                }else{Creattt(url_img,body,messageChatId)}
                
            });
                
        });
        
    }

    if (isDeletingMode) {
        isDeletingMode = false;
        fs.unlink("img/"+msg.chat.id+"/file_"+msg.text+".jpg", function(error){
            if (error) {
                bot.sendMessage(messageChatId, "Такого файла не существует!", options);
            } else {
                bot.sendMessage(messageChatId, "Удален!", options);
            }
            menuDialogue();
        })
    }
});

bot.onText(/\/start/, function (msg, match) {
    fs.readdir("img/"+msg.from.id, function(err, content) {
        if (err) {
            bot.sendMessage(msg.chat.id, 'Добавьте вашу печать.');
        } else {
            if (!content.length) {
                bot.sendMessage(msg.chat.id, 'У вас нет печатей, добавьте новые');
            } else {
                bot.sendMessage(msg.chat.id, 'Выберите действие:', options);
            }
            
        }
    })
});

function menuDialogue() {
}

bot.on('callback_query', function(msg) {
    console.log('msg> callback', msg.data);
    if (msg.data ==='data 1') {
        fs.readdir("img/"+msg.from.id, function(error, items) {
            if(error) {
                console.log(error);
            } else {
                if (!items.length) {
                    bot.sendMessage(msg.from.id, 'Нет печатей для просмотра, добавьте новые');
                } else {
                    for (let i =0; i<items.length; i++) {
                        bot.sendPhoto(msg.from.id, 'img/'+msg.from.id+'/'+items[i], {caption: items[i]});
                    }
                }
            }
        })
    }

    if (msg.data ==='data 2') {
        bot.sendMessage(msg.from.id, "Запишите номер фото:");
        isDeletingMode = true;
    }
});


 function Creattt(url_img,body,messageChatId){
    fs.writeFile(url_img, body, 'binary', function(err) {
        if(err)
        console.log(err); 
        else
        bot.sendMessage(messageChatId, "Файл сохранен -> "+ url_img, options);

        exec('./opencv '+ url_img, (err, stdout, stderr) => {
            if (err) {
              console.log("Error while exec", err);
              console.log("stderr while exec", stderr);
            } else {
                console.log("Success!!!");
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
          });
    }); 
 }
