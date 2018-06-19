require('dotenv').config();

const express = require('express')
const socket = require('socket.io')
const opn = require('opn')

const app = express()

const server = app.listen(4000, () => console.log('listening on port 4000...'))

// Static files
app.use(express.static('public'))

// Socket setup
const io = socket(server)

io.on('connection', (socket) => {

    // Listen for payment events
    socket.on('payment_received', (data) => {
        let message = data.message

        // Send notification message to client
        io.sockets.emit('notifications', message)
        console.log(data)
    })
})

// Open browser
opn('http://localhost:4000');