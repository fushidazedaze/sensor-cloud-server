// cloud-server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // どこからでも接続可能にする
});

// publicフォルダの中身（index.htmlなど）を公開する
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('クライアントが接続しました:', socket.id);

  // スマホから 'sensor-data' という名前でデータが送られてきたら
  socket.on('sensor-data', (data) => {
    // 送り主「以外」の全員（つまり展示PC）にデータを転送する
    socket.broadcast.emit('sensor-data', data);
  });

  socket.on('disconnect', () => {
    console.log('クライアントが切断しました:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});