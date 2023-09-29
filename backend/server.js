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

	socket.on("toggleMic", (newMicState) => {
		socket.to(socket.id).emit("otherUserToggledMic", {
		  userId: socket.id,
		  micState: newMicState,
		});
	  });
	
	socket.on("toggleCamera", (newCameraState) => {
		socket.to(socket.id).emit("otherUserToggledCamera", {
		  userId: socket.id,
		  cameraState: newCameraState,
		});
	});
	
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
