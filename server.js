// cloud-server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } 
});

app.use(express.static('public'));

// 【追加】全スマホの最新データを保持する箱
let sensorDataStore = {};
// 【追加】切断時にデータを消すための紐付けメモ
let socketIdToClientId = {};

io.on('connection', (socket) => {
  console.log('クライアントが接続しました:', socket.id);

  // 【重要】PC側から「私は展示PCです」と名乗るための合言葉
  socket.on('register-monitor', () => {
    socket.join('monitors');
    console.log('📺 展示PCがモニターとして登録されました:', socket.id);
  });

  socket.on('sensor-data', (data) => {
    // 誰がどのIDかメモしておく（切断時の掃除用）
    socketIdToClientId[socket.id] = data.id;
    
    // 【変更】即座にばら撒かず、最新データを箱に上書き保存するだけ！
    sensorDataStore[data.id] = data;
  });

  socket.on('disconnect', () => {
    console.log('クライアントが切断しました:', socket.id);
    // 切断されたスマホのデータを箱から掃除する
    const clientId = socketIdToClientId[socket.id];
    if (clientId) {
      delete sensorDataStore[clientId];
      delete socketIdToClientId[socket.id];
    }
  });
});

// --- ここが「おまとめ送信（バッチ処理）」の心臓部 ---
// 50ミリ秒に1回（秒間20回）、箱の中身をまとめて展示PCにだけ送る
setInterval(() => {
  const clientsData = Object.values(sensorDataStore);
  if (clientsData.length > 0) {
    // 'monitors' の部屋にいる展示PCにだけ送る（スマホには一切送らない！）
    io.to('monitors').emit('batched-sensor-data', clientsData);
  }
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});