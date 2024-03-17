const roomInput = document.querySelector(".room-input")
const socket = new WebSocket("ws://localhost:8080/")
const test = document.querySelector("button")
const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

canvas.width = 600
canvas.height = 600

let paddleX = (canvas.width - 50) / 2

socket.onopen = function(event) {
  console.log("WebSocket connection established.")
}

socket.onmessage = function(event) {
  console.log("Message from server:", event.data)
  // if user entered a room (remove this if it disconnect)
  // roomInput.classList.add("hidden")
  // save room id to local storage if success
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

function drawPaddle(x) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if(x <= 0) {
    ctx.fillRect(0, canvas.height - 50, 50, 6)
    return
  }
  if(x >= canvas.width - 50) {
    ctx.fillRect(canvas.width - 50, canvas.height - 50, 50, 6)
    return
  }
  ctx.fillRect(x, canvas.height - 50, 50, 6)
}

function handleKey (e) {
  if(e.key.toLowerCase() == "a" || e.key == "ArrowLeft") {
    paddleX -= 10
  }

  if(e.key.toLowerCase() == "d" || e.key == "ArrowRight") {
    paddleX += 10
  }
}

window.addEventListener("keydown", handleKey)
function animate() {
  requestAnimationFrame(animate)
  drawPaddle(paddleX)
}

animate()