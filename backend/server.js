require("dotenv").config(); // Load environment variables from .env file

const express = require("express")
const http = require("http")
const app = express()


const server = http.createServer(app)
const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"]
	}
})

let editorContent = ''

io.on("connection", (socket) => {
	socket.emit("me", socket.id)

	// socket.on("toggleMic", () => {
	// 	// Handle toggling of microphone on the server
	// 	// Broadcast the toggleMic event to other users in the same room
	// 	io.to(socket.id).emit("otherUserToggledMic");
	//   });
	
	//   socket.on("toggleCamera", () => {
	// 	// Handle toggling of camera on the server
	// 	// Broadcast the toggleCamera event to other users in the same room
	// 	io.to(socket.id).emit("otherUserToggledCamera");
	//   });
	
	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		socket.join(data.userToCall) //Set user calling to join this room
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		socket.join(data.to) //Set user answering to join this room
		io.to(data.to).emit("callAccepted", data.signal)
	})

	//How to only do editor change for a single room session and not broadcasted?
	socket.on("editor-change", (text) => {
		editorContent = text;
		io.to(socket.id).emit("editor-changed", text) //Editor to only emit to users in the same room
	})



})

server.listen(5000, () => console.log("server is running on port 5000"))
