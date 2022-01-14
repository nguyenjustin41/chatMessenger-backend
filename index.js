const express = require('express');
const cors = require('cors')
const { createServer } = require("http")
const { Server } = require("socket.io")

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

const app = express();

const PORT = process.env.PORT || 5000
const router = require('./router');

const server = createServer(app);

app.use(router)
app.use(cors())

const io = new Server(server, { 
    cors: {
        origin: "http://localhost:3000",
        // methods: ["GET", "POST"],
    }
});



// listening for an event of connection
io.on("connection", (socket) => {
    socket.on("join", ({name, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room })

        if(error) {
            callback(error);
        }
        // joins a user in a room
        socket.join(user.room);

        socket.emit('message', { user:'admin', text:`${user.name} welcome to the room ${user.room}` })

        // sends message to everyone besides that user
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined`})
        

        // to all users in the room except user
        io.to(user.room).emit('roomData', { room: user.room , users: getUsersInRoom(user.room) })
        

        callback();

    })



    // listens for the sendmessage emit from the front end
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        // to all clients besides the sender
        io.to(user.room).emit('message', { user: user.name, text: message })
        io.to(user.room).emit('roomData', { room: user.room,  users: getUsersInRoom(user.room) })
        callback();
    });
    
    socket.on("disconnect", () => {
        console.log(`${socket.id} has disconnected`)
 
        const user = removeUser(socket.id)
        // if there are other users in the room let them know the user has left
        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left` })
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    })

})


server.listen(PORT, () => console.log(`Server has started on port: ${PORT}`))






