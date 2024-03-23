const roomInput = document.querySelector(".room-input")
const socket = new WebSocket("ws://localhost:8080/")
const startBtn = document.querySelector(".start")
const canvas = document.querySelector("canvas")
const counterText = document.querySelector(".counter")
const roomCounterText = document.querySelector(".room-counter")
const ctx = canvas.getContext("2d")

canvas.width = 600
canvas.height = 600

let paddleX = (canvas.width - 50) / 2
let ballPos = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  down: true,
  right: null,
  xVal: 0,
}

let reverseBallPos = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  down: true,
  right: null,
  xVal: 0,
}

let isHost = false
let start = false
let roomID

const client = [{type: "enemy", paddleX},{type: "user", paddleX}]
const enemyPaddle = client.find(el => el.type == "enemy")
const userPaddle = client.find(el => el.type == "user")

socket.onopen = function(event) {
  console.log("WebSocket connection established.")
}

socket.onmessage = function(event) {
  console.log("Message from server:", event.data)
  // if user entered a room (remove this if it disconnect)
  // save room id to local storage if success
  // get the other user game data here
  if(event.data.includes("joined")) {
    alert("Room Joined!")
    roomInput.classList.add("hidden")
    canvas.classList.remove("hidden")
    return
  }

  if(event.data.includes("left")) {
    alert("Other player disconnect")
    roomInput.classList.remove("hidden")
    canvas.classList.add("hidden")
    startBtn.classList.add("hidden")
    roomCounterText.classList.add("hidden")
    start = false
    return
  }

  if(event.data.includes("full")) {
    alert("Room is full!")
    return
  }

  if(event.data.includes("show")) {
    if(isHost) {
      startBtn.classList.remove("hidden")
    }
    roomCounterText.classList.remove("hidden")
    roomCounterText.textContent = "Client Connected: 2/2"
    return
  }

  
  if(event.data.includes("start")) {
    let counter = 6
    counterText.classList.remove("hidden")
    const tick = setInterval(() => {
      counter--
      counterText.textContent = counter == 0 ? "Start" : counter
    }, 1000)
    setTimeout(() => {
      start = true
      counterText.classList.add("hidden")
      clearInterval(tick)
    }, 5500)
    // alert("Game Start!")
    return
  }

  if(event.data.includes("host")) {
    // set the client here to host
    console.log("HOST", event.data)
    roomCounterText.classList.remove("hidden")
    roomCounterText.textContent = "Client Connected: 1/2"
    isHost = true
    return
  }
  const gameData = JSON.parse(event.data)
  const enemy = client.find(el => el.type == "enemy")
  if(gameData.data.type == "paddle") {
    console.log("PADDLE", gameData)
    enemy.paddleX += gameData.data.x
  }
}

socket.onerror = function(error) {
  console.error("WebSocket error:", error)
  // remove the room id here
  roomID = ""
}

socket.onclose = function(event) {
  console.log("WebSocket connection closed.")
  // remove the room id here
  roomID = ""
}

roomInput.addEventListener("keydown", e => {
  if(e.key !== "Enter") return

  sendData(`ROOM ID:${roomInput.value}`)
  roomID = roomInput.value
  roomInput.value = ""
})

startBtn.addEventListener("click", () => {
  let counter = 6
  counterText.classList.remove("hidden")
  startBtn.classList.add("hidden")
  const tick = setInterval(() => {
    counter--
    counterText.textContent = counter == 0 ? "Start" : counter
  }, 1000)
  setTimeout(() => {
    start = true
    counterText.classList.add("hidden")
    startBtn.classList.add("hidden")
    clearInterval(tick)
  }, 5500)
  sendData(`start game :${roomID}`)
})

function drawPaddle(x, type) {
  const Y = type == "enemy" ? 50 : canvas.height - 50
  if(x <= 0) {
    ctx.fillRect(0, Y, 50, 6)
    return
  }
  if(x >= canvas.width - 50) {
    ctx.fillRect(canvas.width - 50, Y, 50, 6)
    return
  }
  ctx.fillRect(x, Y, 50, 6)
}

function drawBall(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fill();
}

function handleKey (e) {
  const user = client.find(el => el.type == "user")
  // send a websocket here
  if(e.key.toLowerCase() == "a" || e.key == "ArrowLeft") {
    user.paddleX -= 20
    sendGameData(20)
  }
  if(e.key.toLowerCase() == "d" || e.key == "ArrowRight") {
    user.paddleX += 20 
    sendGameData(-20)
  }
}

function sendGameData(x) {
  const gameData = {
    RoomID: roomID,
    data: {
      type: "paddle",
      x,
    }
  }

  sendData(JSON.stringify(gameData))
}

function sendData(data) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(data)
  } else {
    console.error('WebSocket connection is not open')
  }
}

function ballMovement(ball) {
  if(ball.down) {
    ball.y += isHost ? 2 : -2
  } else {
    ball.y -= isHost ? 2 : -2
  }

  // check bounce if relative to wall or paddle
  ball.x += ball.right == null ? ball.xVal : ball.right ? 2 : -2

  // change ball x direction relative to paddle collision
  if(ball.y == canvas.height - 50 && !(ball.x > userPaddle.paddleX + 50) && !(userPaddle.paddleX + 50 > ball.x + 50)) {
    ball.down = isHost ? false : true
    let percentage = Math.abs(ball.x - userPaddle.paddleX) / 25
    ball.xVal = percentage == 1 ? 0 : (percentage < 1 ? percentage - 2 : percentage) * 0.8
  }

  if(ball.y == 50 && !(ball.x > enemyPaddle.paddleX + 50) && !(enemyPaddle.paddleX + 50 > ball.x + 50)) {
    ball.down = isHost ? true : false
    let percentage = Math.abs(ball.x - enemyPaddle.paddleX) / 25
    ball.xVal = percentage == 1 ? 0 : (percentage < 1 ? percentage - 2 : percentage) * 0.8
  }

  if(ball.x >= canvas.width) {
    ball.right = false
  }

  if(ball.x <= 0) {
    ball.right = true
  }
  drawBall(ball.x, ball.y)
}

window.addEventListener("keydown", handleKey)
function animate() {
  requestAnimationFrame(animate)
  if(!start) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ballMovement(isHost ? ballPos: reverseBallPos)
 
  client.forEach(element => {
    drawPaddle(element.paddleX, element.type)
  })
}

animate()

// fixed paddle control