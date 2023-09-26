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

let editorContent = '';

io.on("connection", (socket) => {
	socket.emit("me", socket.id)

	socket.emit('initial-editor-content', editorContent);
	
	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})

	socket.on('editor-change', (text) => {
		editorContent = text;
		socket.broadcast.emit('editor-changed', text);
	});



})

server.listen(5000, () => console.log("server is running on port 5000"))
