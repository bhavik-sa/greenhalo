import { io } from "socket.io-client";
import { sendDataToUsers } from "./socket_server.js";
let socketAsClient;

export const casingData = new Map();
export const socketConnection = async () => {
  try {
    // Create a socket connection to the server

    //  api from Host Backend
    //  socket connection with Host Backend
    socketAsClient = io("ws://127.0.0.1:3002");

    socketAsClient.on("connection", (socket) => {
      console.log("Connection established");
      console.log(socket.id);
    });

    socketAsClient.on("marketWatch", (receivedData) => {
      console.log({ receivedData });
      if (receivedData && receivedData.product) {
        sendDataToUsers(receivedData.product, "marketWatch", receivedData.data);
        casingData.set(receivedData.product, receivedData.data);
      }
    });
  } catch (error) {
    console.error("Error", error);
  }
};

export const sendDataToAdministerServer = (name, data) => {
  if (socketAsClient) {
    socketAsClient.emit("joinRoom", data);
    socketAsClient.emit(name, data);
  }
};
