const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const socketIO = require('socket.io');
const express = require('express');
const fs = require('fs');
const http = require('http');
const fetch = require('node-fetch');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({ extended:true}));


const SESSION_FILE_PATH = './wa-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

fetch('http://127.0.0.1:8080/api/user-tab')
    .then(res => res.json())
    .then(text => {
        console.log(text['data'][0].id_user)
    }
);

    
/* app.get('http://127.0.0.1:8000/api/user-tab', (req, res) => {
    //res.send('Hello World!')
    console.log(res)
  });
 */  
app.get('/', (req, res) => {
    res.sendFile('index.html', {root:__dirname});
    /*res.status(200).json({
        status: true,
        message: 'Not just hello world!'
    })*/
})
const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });


client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }else if(msg.body == 'Hi'){
        msg.reply('Hi too');
    }else if(msg.body == 'rezatest'){

        let data = {
            title: 123,
            content: "loren impsum doloris",
        };

        fetch('http://127.0.0.1:8080/api/articles/store', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json())
        .then(json => console.log(json));
    }

});

client.initialize();

//socket io
io.on('connection', function(socket){
    socket.emit('message', 'Connecting...');

    client.on('ready', () => {
      socket.emit('ready', 'Whatsapp is ready!');
      socket.emit('message', 'Whatsapp is ready!');  
    });
    client.on('authenticated', (session) => {
      socket.emit('authenticated', 'Whatsapp is authenticated!');
      socket.emit('message', 'Whatsapp is authenticated!');
      console.log('authenticated', session);
        sessionCfg=session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });

    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        //qrcode.generate(qr, {small: true});

        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code received, scan please!');
        })
    });


})

//send message

app.post('/send-message', (req, res) => {
    const number = req.body.number;
    const message = req.body.message;

    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        })
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});
server.listen(8000, function(){
    console.log('App running on *: 8000');
});