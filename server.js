const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const rooms = new Map();
const players = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', (data) => {
    const { playerName } = data;
    const roomId = 'room_' + Math.random().toString(36).substr(2, 8);
    
    rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      host: socket.id,
      currentMovie: null,
      gameState: 'waiting',
      gameObjects: []
    });

    const room = rooms.get(roomId);
    
    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: true
    });

    players.set(socket.id, {
      id: socket.id,
      name: playerName,
      roomId: roomId
    });

    socket.join(roomId);

    console.log(`Room ${roomId} created by ${playerName}`);

    socket.emit('room_created', {
      roomId: roomId,
      player: room.players.get(socket.id)
    });
  });

  socket.on('join_room', (data) => {
    const { roomId, playerName } = data;
    
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('join_error', { message: 'Комната не найдена' });
      return;
    }

    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: false
    });

    players.set(socket.id, {
      id: socket.id,
      name: playerName,
      roomId: roomId
    });

    socket.join(roomId);

    socket.emit('room_state', {
      movie: room.currentMovie,
      gameObjects: room.gameObjects,
      players: Array.from(room.players.values())
    });

    io.to(roomId).emit('player_joined', {
      player: room.players.get(socket.id),
      players: Array.from(room.players.values())
    });

    console.log(`Player ${playerName} joined room ${roomId}`);
  });

  socket.on('game_object_added', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    room.gameObjects.push(data.object);
    io.to(player.roomId).emit('game_object_added', data);
  });

  socket.on('game_object_removed', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    room.gameObjects = room.gameObjects.filter(obj => obj.id !== data.objectId);
    io.to(player.roomId).emit('game_object_removed', data);
  });

  socket.on('game_object_updated', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    const objIndex = room.gameObjects.findIndex(obj => obj.id === data.object.id);
    if (objIndex !== -1) {
      room.gameObjects[objIndex] = data.object;
    }
    
    io.to(player.roomId).emit('game_object_updated', data);
  });

  socket.on('clear_game_field', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    room.gameObjects = [];
    io.to(player.roomId).emit('clear_game_field', data);
  });

  socket.on('start_game', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room || room.host !== socket.id) return;

    const movies = [
      { title: "Титаник", year: "1997" },
      { title: "Матрица", year: "1999" },
      { title: "Властелин Колец", year: "2001" },
      { title: "Гарри Поттер", year: "2001" },
      { title: "Звездные Войны", year: "1977" },
      { title: "Аватар", year: "2009" },
      { title: "Король Лев", year: "1994" },
      { title: "Пираты Карибского моря", year: "2003" },
      { title: "Холодное Сердце", year: "2013" },
      { title: "Назад в будущее", year: "1985" }
    ];

    room.currentMovie = movies[Math.floor(Math.random() * movies.length)];
    room.gameState = 'playing';

    socket.emit('movie_reveal', room.currentMovie);
    socket.to(player.roomId).emit('game_started', {
      message: "Игра началась! Создатель составляет сцену из фильма. Угадайте фильм!"
    });

    console.log(`Game started in room ${player.roomId} with movie: ${room.currentMovie.title}`);
  });

  socket.on('chat_message', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    const messageData = {
      type: 'chat_message',
      playerId: socket.id,
      playerName: player.name,
      message: data.message,
      timestamp: Date.now()
    };

    if (room.currentMovie && room.gameState === 'playing') {
      const userAnswer = data.message.toLowerCase().replace(/["«»]/g, '');
      const correctAnswer = room.currentMovie.title.toLowerCase();
      
      if (userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
        messageData.isCorrect = true;
        
        const playerData = room.players.get(socket.id);
        if (playerData) {
          playerData.score += 1;
          
          io.to(player.roomId).emit('player_scored', {
            playerId: socket.id,
            playerName: player.name,
            newScore: playerData.score,
            message: data.message
          });
        }
      }
    }

    io.to(player.roomId).emit('chat_message', messageData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        room.players.delete(socket.id);
        
        if (room.host === socket.id && room.players.size > 0) {
          const newHostId = Array.from(room.players.keys())[0];
          room.host = newHostId;
          room.players.get(newHostId).isHost = true;
          
          io.to(player.roomId).emit('new_host', {
            newHostId: newHostId,
            newHostName: room.players.get(newHostId).name
          });
        }

        io.to(player.roomId).emit('player_left', {
          playerId: socket.id,
          players: Array.from(room.players.values())
        });

        if (room.players.size === 0) {
          rooms.delete(player.roomId);
          console.log(`Room ${player.roomId} deleted (empty)`);
        }
      }
      
      players.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
