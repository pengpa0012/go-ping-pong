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

type GameData struct {
	RoomID int `json:"roomID,string,omitempty"`
	Data interface {} `json:"data,omitempty"`
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

	// Handle client disconnection
	defer func() {
		// Remove client from the map when the connection is closed
		delete(clients, conn)

		// Notify other clients in the same room about the disconnection
		if client.RoomID != 0 {
				// restart game state here
				message := fmt.Sprintf("Client %v left room %v\n", client.ClientID, client.RoomID)
				broadcastGameData(client.RoomID, websocket.TextMessage, []byte(message), conn)
		}
	}()


	for {
    messageType, p, err := conn.ReadMessage()
    if err != nil {
        log.Println(err)
        return
    }

		clientMessage := string(p)

		if strings.Contains(clientMessage, "start") {
			roomID, err := strconv.Atoi(strings.Split(clientMessage, ":")[1])

			if err != nil {
				fmt.Println("Error Getting Room ID")
				return
			}

			for _, client := range clients {
				if client.Conn != conn && client.RoomID == roomID {
					if err := client.Conn.WriteMessage(messageType, []byte("start game")); err != nil {
						fmt.Println(err)
					}
				}
			}
		} else if strings.Contains(clientMessage, "ROOM ID") {
			roomID, err := strconv.Atoi(strings.Split(clientMessage, ":")[1])
			if err != nil {
				fmt.Println("Error Room ID")
				return
			}

			// Check room capacity
			// notify here if room id already has two client
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
				if countClientsInRoom(roomID) == 0 {
					for _, client := range clients {
						if client.Conn == conn {
							if err := client.Conn.WriteMessage(messageType, []byte("Your are the host.")); err != nil {
								fmt.Println(err)
							}
						}
					}
				}

				if countClientsInRoom(roomID) == 1 {
					for _, client := range clients {
						if client.RoomID == roomID {
							if err := client.Conn.WriteMessage(messageType, []byte("show button")); err != nil {
								fmt.Println(err)
							}
						}
					}
				}

				client.RoomID = roomID
				message := fmt.Sprintf("Client %v joined room %v\n", client.ClientID, client.RoomID)
				broadcastToOneClient(conn, messageType, []byte(message))
			}

		}	else {
			// Parse JSON data
			var gameData GameData
			if err := json.Unmarshal([]byte(p), &gameData); err != nil {
				fmt.Println(err)
				return
		 	}
			broadcastGameData(gameData.RoomID, messageType, p, conn)
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

func broadcastGameData(roomID int, messageType int, data []byte, conn *websocket.Conn) {
	for _, client := range clients {
		// Skip sending the message to the sender's connection
		if client.Conn == conn {
			continue
		}

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
	log.Fatal(http.ListenAndServe("localhost:8080", nil))
}

// fixed paddle data 