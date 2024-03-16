const roomInput = document.querySelector(".room-input")
const socket = new WebSocket("ws://localhost:8080/");
const test = document.querySelector("button")

socket.onopen = function(event) {
  console.log("WebSocket connection established.");
};

socket.onmessage = function(event) {
  console.log("Message from server:", event.data);
  // if user entered a room (remove this if it disconnect)
  // roomInput.classList.add("hidden")
  // save room id to local storage if success
};

socket.onerror = function(error) {
  console.error("WebSocket error:", error);
  // remove the room id here
};

socket.onclose = function(event) {
  console.log("WebSocket connection closed.");
  // remove the room id here
};

roomInput.addEventListener("keydown", e => {
  if(e.key !== "Enter") return
  socket.send(`ROOM ID:${roomInput.value}`);
  roomInput.value = ""
})

test.addEventListener("click", () => socket.send(JSON.stringify({roomID: 1, data: "test"})))
