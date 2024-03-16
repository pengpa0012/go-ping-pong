const roomInput = document.querySelector(".room-input")
const socket = new WebSocket("ws://localhost:8080/");

socket.onopen = function(event) {
  console.log("WebSocket connection established.");
  socket.send("Hello, server!");
};

socket.onmessage = function(event) {
  console.log("Message from server:", event.data);
};

socket.onerror = function(error) {
  console.error("WebSocket error:", error);
};

socket.onclose = function(event) {
  console.log("WebSocket connection closed.");
};

roomInput.addEventListener("keydown", e => {
  if(e.key !== "Enter") return
  socket.send(`ROOM ID: ${roomInput.value}`);
  roomInput.value = ""
  roomInput.classList.add("hidden")
})

