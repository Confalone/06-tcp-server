'use strict';

// First Party Modules
const net = require('net');
const faker = require('faker');

const server = net.createServer();
let users = [];

class User {
  constructor(socket) {
    this.id = faker.random.uuid();
    this.name = faker.name.jobTitle();
    this.socket = socket;
    users.push(this);
  }
}

let commandParser = (message, socket) => {
  let name;
  users.forEach(user => {
    if(user.socket === socket) {
      name = user.name;
    }
  });

  if(message.startsWith('@')) {
    let parsedCommand = message.split(' ');
    let command = parsedCommand[0];
    let userNames = users.map(user => {
      return user.name;
    });

    switch(command) {

    case '@quit': 
      users.forEach((user, index) => {
        if(user.socket === socket) {
          users.splice(index, 1);
        }
      }); 
      socket.end(`Ciao ${name}`);
      break;

    case '@list':
      socket.write(users.map(user => user.name).join('\n') + '\n');
      break;

    case '@nickname':
      users.forEach(user => {
        if (user.socket === socket) {
          user.name = parsedCommand[1];
        }
      });
      break;

    case '@dm':
      if(!(userNames.includes(parsedCommand[1]))) {
        for(let user of users) {
          if(user.socket === socket) {
            user.socket.write(`${parsedCommand[1]} is not in this chatroom.\n`);
          }
        }
        break;
      }
      users.forEach(user => {
        if (user.name === parsedCommand[1]) {
          let dm = parsedCommand.splice(2).join(' ');
          user.socket.write(`Direct message from ${name}: ${dm}\n`);
        }
      });
      break;
    default:
      socket.write(`acceptable commands: @quit, @list, @nickname, and @dm.\n`);
      break;
    }
    return true;
  } 
  return false;
};


server.on('connection', (socket) => {
  new User(socket);
  let screenName;
  users.forEach(user => {
    if (user.socket === socket) {
      screenName = user.name;
    }
  });
  socket.write(`Welcome to my World\n`);
  socket.write(`Hello ${screenName}\n`);

  socket.on('data', (data) => {
    users.forEach(user => {
      if(user.socket === socket) {
        screenName = user.name;
      }
    });
    let message = data.toString().trim();

    if (commandParser(message,socket))
      return;

    for (let user of users) {
      if(user.socket !== socket)
        user.socket.write(`${screenName}: ${message}\n`);
    }
  });
  let removeUser = (socket) => () => {
    users = users.filter((user) => {
      return user.socket !== socket;
    });
  };
  socket.on('error', removeUser(socket));
  socket.on('close', removeUser(socket));
});

const app = module.exports = {};

app.start = (port, callback) => {
  console.log(`Server is running on port ${port}`);
  return server.listen(port, callback);
};

app.stop = (callback) => {
  console.log('Server is off');
  return server.close(callback);
};