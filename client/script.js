const roomInput = document.querySelector(".room-input")
const socket = new WebSocket("ws://localhost:8080/")
const startBtn = document.querySelector(".start")
const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

canvas.width = 600
canvas.height = 600

let paddleX = (canvas.width - 50) / 2
let ballPos = {
  x: canvas.width / 2,
  y: 50,
  down: true,
  right: undefined,
  xVal: 0,
}

let isHost = undefined
let start = false

const client = [{type: "enemy", paddleX},{type: "user", paddleX}]

socket.onopen = function(event) {
  console.log("WebSocket connection established.")
}

socket.onmessage = function(event) {
  // console.log("Message from server:", event.data)
  // if user entered a room (remove this if it disconnect)
  // roomInput.classList.add("hidden")
  // save room id to local storage if success
  // get the other user game data here
  if(event.data.includes("joined")) return

  if(event.data.includes("full")) return

  if(event.data.includes("start")) {
    start = true
    return
  }

  if(event.data.includes("host")) {
    // set the client here to host
    console.log("HOST", event.data)
    isHost = true
    startBtn.classList.remove("hidden")
    return
  }

  const gameData = JSON.parse(event.data)
  const enemy = client.find(el => el.type == "enemy")
  
  if(gameData.data) {
    console.log("PADDLE", gameData)
    enemy.paddleX = gameData.data.x
  } else {
    // check here what ball state changes (x,y,right,down,xVal)
    console.log("BALL", gameData)
    // if host dont set this
    if(!isHost) {
      ballPos = gameData
    }
  }
  // check here if it is from enemy paddle or ball
}

socket.onerror = function(error) {
  console.error("WebSocket error:", error)
  // remove the room id here
  localStorage.removeItem("roomID")
}

socket.onclose = function(event) {
  console.log("WebSocket connection closed.")
  // remove the room id here
  localStorage.removeItem("roomID")
}

roomInput.addEventListener("keydown", e => {
  if(e.key !== "Enter") return

  sendData(`ROOM ID:${roomInput.value}`)
  localStorage.setItem("roomID", roomInput.value)
  roomInput.value = ""
})

startBtn.addEventListener("click", () => {
  start = true
  sendData("start game")
  // send start game here
  console.log(start)
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
    sendGameData(user.paddleX)
  }
  if(e.key.toLowerCase() == "d" || e.key == "ArrowRight") {
    user.paddleX += 20
    sendGameData(user.paddleX)
  }
}

function sendGameData(x) {
  const gameData = {
    RoomID: localStorage.getItem("roomID"),
    data: {
      x,
      // add the ball data here as well
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

window.addEventListener("keydown", handleKey)
function animate() {
  requestAnimationFrame(animate)
  console.log(start)
  if(!start) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const enemyPaddle = client.find(el => el.type == "enemy")
  const userPaddle = client.find(el => el.type == "user")

  if(ballPos.down) {
    ballPos.y += 5
  } else {
    ballPos.y -= 5
  }

  // check bounce if relative to wall or paddle
  ballPos.x += ballPos.right == undefined ? ballPos.xVal : ballPos.right ? 5 : -5

  // change ball x direction relative to paddle collision
  if(ballPos.y == canvas.height - 50 && !(ballPos.x > userPaddle.paddleX + 50) && !(userPaddle.paddleX + 50 > ballPos.x + 50)) {
    ballPos.down = false
    let percentage = Math.abs(ballPos.x - userPaddle.paddleX) / 25
    ballPos.xVal = percentage == 1 ? 0 : (percentage < 1 ? percentage - 2 : percentage) * 5
  }

  if(ballPos.y == 50 && !(ballPos.x > enemyPaddle.paddleX + 50) && !(enemyPaddle.paddleX + 50 > ballPos.x + 50)) {
    ballPos.down = true
    let percentage = Math.abs(ballPos.x - enemyPaddle.paddleX) / 25
    ballPos.xVal = percentage == 1 ? 0 : (percentage < 1 ? percentage - 2 : percentage) * 0.8
  }

  if(ballPos.x >= canvas.width) {
    ballPos.right = false
  }

  if(ballPos.x <= 0) {
    ballPos.right = true
  }
  // send ball data
  // if not host dont send this data
  // if host send this
  if(isHost) {
    sendData(JSON.stringify(ballPos))
  }

  drawBall(ballPos.x, ballPos.y)
 
  client.forEach(element => {
    drawPaddle(element.paddleX, element.type)
  })
}

animate()

// fixed paddle control
// fixed game sync
// fixed ball initial position
// add start game