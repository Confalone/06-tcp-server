'use strict';

require('dotenv').config();
const chatroom = require('./src/chatroom.js');
const PORT = process.env.PORT;

chatroom.start(PORT, () => {});