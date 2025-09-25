import { casingData, sendDataToAdministerServer } from "./socket_client.js";

let socketAsServer = "";
export const setIoObject = async (socketIo) => {
  console.log("Socket connection start");
  socketAsServer = socketIo;
  if (socketAsServer) await setSocket(socketAsServer); // Listen ws
};

export const setSocket = async (socketAsServer) => {
  try {
    socketAsServer.on("connection", async (socket) => {
      socket.on("subscribeToAdministerServerMarket", async (data) => {
        sendDataToAdministerServer("subscribeToServerMarket", data);
      });
      socket.on("joinAdministerRoom", (data) => {
        const rooms = JSON.parse(data);
        if (Array.isArray(rooms)) {
          rooms.forEach((room) => {
            socket.join(room);
            console.log(casingData.has(room));
            if (casingData.has(room))
              socket.emit("marketWatch", casingData.get(room));
          });
        }
      });
      socket.on("leaveRoom", async function (room) {
        // await leaveRoom(room, userId, socket)
      });
      socket.on("reJoinRoom", async function () {
        // await joinUserRoom(userId, socket)
      });
      socket.on("disconnect", async function () {
        // console.log('A user disconnected')
      });
    });
  } catch (e) {
    console.log("Error in set socket");
    console.log(e);
  }
};

export const sendDataToUsers = (room, name, data) => {
  if (socketAsServer) {
    socketAsServer.to(room).emit(name, data);
  }
};
