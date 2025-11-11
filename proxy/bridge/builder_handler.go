package bridge

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/containers/image/v5/docker"
	"github.com/containers/image/v5/types"
	"github.com/gorilla/mux"

	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
)

type builderHandler struct {
	target *url.URL
	proxy  *httputil.ReverseProxy
}

// TestRegistryCredentialsRequest represents the request to test registry credentials
type TestRegistryCredentialsRequest struct {
	URL           string `json:"url"`
	Username      string `json:"username,omitempty"`
	Password      string `json:"password,omitempty"`
	SkipTLSVerify bool   `json:"skipTLSVerify,omitempty"`
}

// TestRegistryCredentialsResponse represents the response from testing registry credentials
type TestRegistryCredentialsResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func (h builderHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	forwardPath := mux.Vars(r)["forward"]

	// Handle test-registry-credentials endpoint locally
	if strings.HasSuffix(forwardPath, "test-registry-credentials") ||
		strings.Contains(forwardPath, "test-registry-credentials") {
		handleTestRegistryCredentials(w, r)
		return
	}

	if h.target == nil {
		http.Error(w, "Builder server not configured", http.StatusServiceUnavailable)
		return
	}

	r.URL.Host = h.target.Host
	r.URL.Scheme = h.target.Scheme
	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
	r.Host = h.target.Host

	// Map builder API paths to FlightCtl API paths
	// UI frontend already sends: /api/builder/v1/imagebuilds
	// So forwardPath arrives as: "v1/imagebuilds"
	// Backend expects: /api/v1/imagebuilds
	// We just need to add /api/ prefix
	r.URL.Path = "/api/" + forwardPath

	// Log the proxied request for debugging
	log.GetLogger().Debugf("Builder proxy: %s %s -> %s%s", r.Method, forwardPath, h.target.String(), r.URL.Path)

	h.proxy.ServeHTTP(w, r)
}

func NewBuilderHandler(tlsConfig *tls.Config) http.Handler {
	// Use BuilderApiUrl if set, otherwise fallback to main FlightCtl API
	log.GetLogger().Infof("BuilderApiUrl: %s", config.BuilderApiUrl)
	apiUrl := config.BuilderApiUrl
	if apiUrl == "" {
		// Use the main FlightCtl API as fallback - ImageBuild endpoints are there
		apiUrl = config.FctlApiUrl
		log.GetLogger().Info("FLIGHTCTL_BUILDER_SERVER not set, using main FlightCtl API for builder endpoints")
	}

	target, proxy := createReverseProxy(apiUrl)
	proxy.Transport = &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	return &builderHandler{target: target, proxy: proxy}
}

// handleTestRegistryCredentials handles testing registry credentials
func handleTestRegistryCredentials(w http.ResponseWriter, r *http.Request) {
	logger := log.GetLogger()
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TestRegistryCredentialsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Errorf("Failed to decode test credentials request: %v", err)
		response := TestRegistryCredentialsResponse{
			Success: false,
			Message: fmt.Sprintf("Invalid request body: %v", err),
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	if req.URL == "" {
		response := TestRegistryCredentialsResponse{
			Success: false,
			Message: "Registry URL is required",
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	logger.Infof("Testing registry credentials for: %s", req.URL)

	// Test the registry credentials
	success, message := testRegistryAccess(req)

	response := TestRegistryCredentialsResponse{
		Success: success,
		Message: message,
	}

	if success {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusOK) // Still 200, but success=false in body
	}
	json.NewEncoder(w).Encode(response)
}

// testRegistryAccess attempts to authenticate and access a container registry
func testRegistryAccess(req TestRegistryCredentialsRequest) (bool, string) {
	logger := log.GetLogger()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Create system context with credentials
	sys := &types.SystemContext{
		DockerInsecureSkipTLSVerify: types.NewOptionalBool(req.SkipTLSVerify),
	}

	if req.Username != "" && req.Password != "" {
		sys.DockerAuthConfig = &types.DockerAuthConfig{
			Username: req.Username,
			Password: req.Password,
		}
	}

	// Parse the docker reference
	ref, err := docker.ParseReference("//" + strings.TrimPrefix(req.URL, "docker://"))
	if err != nil {
		logger.Errorf("Failed to parse registry reference %s: %v", req.URL, err)
		return false, fmt.Sprintf("Invalid registry URL format: %v", err)
	}

	// Try to get the image source to verify we can access it
	src, err := ref.NewImageSource(ctx, sys)
	if err != nil {
		logger.Errorf("Failed to access registry %s: %v", req.URL, err)

		// Provide more specific error messages
		errMsg := err.Error()
		if strings.Contains(errMsg, "401") || strings.Contains(errMsg, "unauthorized") {
			return false, "Authentication failed: invalid credentials"
		} else if strings.Contains(errMsg, "404") || strings.Contains(errMsg, "not found") {
			return false, "Image or repository not found"
		} else if strings.Contains(errMsg, "connection refused") || strings.Contains(errMsg, "no such host") {
			return false, "Cannot connect to registry: check URL and network connectivity"
		} else if strings.Contains(errMsg, "certificate") || strings.Contains(errMsg, "tls") {
			return false, "TLS/Certificate error: consider enabling 'Skip TLS verification'"
		}

		return false, fmt.Sprintf("Failed to access registry: %v", err)
	}
	defer src.Close()

	logger.Infof("Successfully tested registry access for: %s", req.URL)

	if req.Username != "" {
		return true, "Successfully authenticated and accessed the registry"
	}
	return true, "Successfully accessed the registry (anonymous access)"
}
