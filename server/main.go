package main

import (
	"net/http"
	"time"

	"github.com/akiratatsuhisa/pubsub"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Dto struct {
	Name      string `json:"name"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

func main() {
	ps := pubsub.NewPubSub()

	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	r.Use(cors.New(config))

	r.POST(":room/send", func(ctx *gin.Context) {
		room := ctx.Param("room")

		name, _ := ctx.GetPostForm("name")
		message, _ := ctx.GetPostForm("message")

		ps.Publish(room, &Dto{
			Name:      name,
			Message:   message,
			Timestamp: time.Now().UnixMilli(),
		})

		ctx.JSON(http.StatusOK, gin.H{
			"message": "The message was sent",
		})
	})

	r.GET(":room/messages", func(ctx *gin.Context) {
		room := ctx.Param("room")

		listener := make(chan interface{})
		unsubscribe := ps.Subscribe(room, listener)
		defer unsubscribe()

		writer := ctx.Writer
		header := writer.Header()

		header.Set("Content-Type", "text/event-stream")
		header.Set("Cache-Control", "no-cache")
		header.Set("Connection", "keep-alive")
		writer.Flush()

		clientGone := writer.CloseNotify()

		for {
			select {
			case event := <-listener:
				ctx.SSEvent("data", event)
				writer.Flush()
			case <-clientGone:
				return
			}
		}
	})
	r.Run("localhost:8080")
}
