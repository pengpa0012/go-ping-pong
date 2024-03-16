package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections for now
		return true
	},
}

type Client struct {
	Conn    *websocket.Conn
	ClientID string
	RoomID int
}

var clients = make(map[*websocket.Conn]*Client)

func handler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
			log.Println(err)
			return
	}
	defer conn.Close()


	client := &Client{
		Conn:    conn,
		ClientID: fmt.Sprintf("%p", conn),
		RoomID: 0,
	}

	fmt.Printf("Client connected: %s\n", client.ClientID)
	clients[conn] = client


	for {
    messageType, p, err := conn.ReadMessage()
    if err != nil {
        log.Println(err)
        return
    }


		
		clientMessage := string(p)
		if strings.Contains(clientMessage, "ROOM ID") {
			// enter on a room
			// check room capacity
			// get all clients, filter out the room id base on user input
			// check if less than 2 are connected
			// if yes set the room id to client
			// else reject message
			roomID, err := strconv.Atoi(strings.Split(clientMessage, ":")[1])

			if err != nil {
				fmt.Println("Error Room ID")
				return
			}

			// Check room capacity
			if countClientsInRoom(roomID) >= 2 {
				// Reject connection if more than 2 clients are already in the room
				for _, client := range clients {
					if client.Conn == conn {
						if err := client.Conn.WriteMessage(messageType, []byte("Room full. Rejecting connection.")); err != nil {
							fmt.Println(err)
						}
					}
				}
			} else {
				// Assign room ID to client
				client.RoomID = roomID
				message := fmt.Sprintf("Client %v joined room %v\n", client.ClientID, client.RoomID)
				broadcastToOneClient(conn, messageType, []byte(message))
			}

		}	else {
			// passing game data
			// pass the room id on the client
			// data, err := strconv.Atoi(strings.Split(clientMessage, ":")[1])

			// if err != nil {
			// 	fmt.Println("Error Game Data")
			// 	return
			// }

			// Parse JSON data
			var clientData Client
			err = json.Unmarshal(p, &clientData)
			if err != nil {
					http.Error(w, "Failed to parse JSON", http.StatusBadRequest)
					return
			}

			fmt.Println("Game Data", clientData)	
			// broadcastGameData(data, messageType, p)
		}
	}
}

func countClientsInRoom(roomID int) int {
	count := 0
	for _, client := range clients {
		if client.RoomID == roomID {
			count++
		}
	}
	return count
}

func broadcastGameData(roomID int, messageType int, data []byte) {
	for _, client := range clients {
		if client.RoomID == roomID {
			if err := client.Conn.WriteMessage(messageType, data); err != nil {
				fmt.Println(err)
			}
		}
	}
}

func broadcastToOneClient(conn *websocket.Conn, messageType int, data []byte) {
	for _, client := range clients {
		if client.Conn == conn {
			if err := client.Conn.WriteMessage(messageType, data); err != nil {
				fmt.Println(err)
			}
		}
	}
}


func main() {
	http.HandleFunc("/", handler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}