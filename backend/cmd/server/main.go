package main

import (
	"log"

	"github.com/llmchatbot/backend/internal/app"
)

func main() {
	// Initialize application
	application, err := app.NewApp()
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}
	defer application.Close()

	// Initialize dependencies
	deps := app.InitializeDependencies(application)

	// Start guest account cleanup
	application.StartGuestCleanup(deps)

	// Setup router
	router := app.SetupRouter(application, deps)

	// Create and run server
	server := app.NewServer(application, router)
	server.Run()
}
