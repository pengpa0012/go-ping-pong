package main

import (
	"fmt"
	"log"
	"net/http"
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
	conn    *websocket.Conn
	clientID string
	clientRoom int
}

var clients = make(map[*websocket.Conn]bool)

func handler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
			log.Println(err)
			return
	}
	defer conn.Close()


	client := &Client{
		conn:    conn,
		clientID: fmt.Sprintf("%p", conn),
	}

	fmt.Printf("Client connected: %s\n", client.clientID)
	clients[conn] = true


	for {
    messageType, p, err := conn.ReadMessage()
    if err != nil {
        log.Println(err)
        return
    }

		clientMessage := string(p)
		if strings.Contains(clientMessage, "ROOM ID") {
			// enter on a room
			fmt.Println("ENTER ROOM", clientMessage)	
		}	else {
			// passing game data
			fmt.Println("Game Data", clientMessage)	
		}

		
    if err := conn.WriteMessage(messageType, p); err != nil {
        log.Println(err)
        return
    }
	}
}


func main() {
	http.HandleFunc("/", handler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}