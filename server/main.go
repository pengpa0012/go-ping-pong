package main

import (
	"fmt"
	"log"
	"net/http"

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

func handler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
			log.Println(err)
			return
	}
	defer conn.Close()

	for {
    messageType, p, err := conn.ReadMessage()
    if err != nil {
        log.Println(err)
        return
    }
    if err := conn.WriteMessage(messageType, p); err != nil {
        log.Println(err)
        return
    }
	}
}


func main() {
	fmt.Println("Hello")
	http.HandleFunc("/", handler)
	http.ListenAndServe(":8080", nil)
}