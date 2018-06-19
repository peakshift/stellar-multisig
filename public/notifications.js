const socket = io.connect('http://localhost:4000')
const notificationsList = document.getElementById('Notifications')

// Listen for events
socket.on('notifications', (message) => {
    notificationsList.innerHTML += '<li>' + message + '</li>'
})