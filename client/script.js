const roomInput = document.querySelector(".room-input")
const socket = new WebSocket("ws://localhost:8080/")
const test = document.querySelector("button")
const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

canvas.width = 600
canvas.height = 600

let paddleX = (canvas.width - 50) / 2
let ballPos = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  down: true,
  right: undefined,
  xVal: 0,
}

const client = [{type: "enemy", paddleX},{type: "user", paddleX}]

socket.onopen = function(event) {
  console.log("WebSocket connection established.")
}

socket.onmessage = function(event) {
  console.log("Message from server:", event.data)
  // if user entered a room (remove this if it disconnect)
  // roomInput.classList.add("hidden")
  // save room id to local storage if success
  // get the other user game data here
  if(event.data.includes("joined")) return
  const gameData = JSON.parse(event.data)
  const enemy = client.find(el => el.type == "enemy")
  enemy.paddleX = gameData.data.x
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
  socket.send(`ROOM ID:${roomInput.value}`)
  localStorage.setItem("roomID", roomInput.value)
  roomInput.value = ""
})

// test.addEventListener("click", () => socket.send(JSON.stringify({roomID: localStorage.getItem("roomID"), data: "test"})))

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
  if (socket.readyState === WebSocket.OPEN) {
    // socket.send(JSON.stringify(gameData))
  } else {
    console.error('WebSocket connection is not open')
  }
}

window.addEventListener("keydown", handleKey)
function animate() {
  requestAnimationFrame(animate)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const enemyPaddle = client.find(el => el.type == "enemy")
  const userPaddle = client.find(el => el.type == "user")

  if(ballPos.down) {
    ballPos.y += 5
  } else {
    ballPos.y -= 5
  }

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

  drawBall(ballPos.x, ballPos.y)
 
  client.forEach(element => {
    drawPaddle(element.paddleX, element.type)
  })
}

animate()

// fixed paddle control