'use strict';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    compress = require('compression'),
    cors = require('cors'),
    path = require('path'),
    os = require('os'),
    port = process.env.PORT || 3000;
const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else if (process.env.NODE_ENV === 'production') {
    app.use(compress());
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/*app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.use(express.static(path.join(__dirname, './client')));*/

app.get('/', (req, res) => {
    res.statusCode = 200;
    res.end();
});


const server = app.listen(port, () => {
    //console.log(`Server listening on port ${port}`);
});

const io = require('socket.io')(server);
let initiator = {
    connected: false,
    id: ''
};

let connections = 0;
io.on('connection', socket => {
    connections++;
    let isInitiator = 'jumas2017';
    let room = socket.handshake.query.room;
    if (room === isInitiator) {
        console.log('Initiator connected...');
        initiator.connected = true;
        initiator.id = socket.id;
        socket.emit('initiator', { initiatorID: initiator.id });
        socket.broadcast.emit('client', { hasInitiator: initiator.connected, initiatorID: initiator.id });
    } else {
        console.log('Client connected...');
        socket.emit('client', { hasInitiator: initiator.connected, initiatorID: initiator.id });
        if (initiator.connected) {
            io.to(initiator.id).emit('ready', socket.id);
        }
    }

    socket.on('message', message => {
        socket.broadcast.emit('message', { message: message, id: socket.id });
    });



    socket.on('disconnect', () => {
        connections--;
        if (socket.id === initiator.id) {
            console.log('Initiator disconnected...');
            initiator.connected = false;
            initiator.id = '';
            socket.broadcast.emit('noInitiator');
        } else {
            console.log('Client disconnected...');
        }
    });
});