<?php

namespace App\Core;

class Router
{
    private $routes = [];
    private $middleware = [];

    public function get(string $path, string $handler): self
    {
        return $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, string $handler): self
    {
        return $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, string $handler): self
    {
        return $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, string $handler): self
    {
        return $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, string $handler): self
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'middleware' => $this->middleware
        ];
        $this->middleware = []; // Reset middleware for next route
        return $this;
    }

    public function middleware(array $middleware): self
    {
        $this->middleware = $middleware;
        return $this;
    }

    public function run(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Remove /api prefix if present
        $path = preg_replace('#^/api#', '', $path);
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchPath($route['path'], $path)) {
                $params = $this->extractParams($route['path'], $path);
                $this->executeRoute($route, $params);
                return;
            }
        }

        // Route not found
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Route not found']);
    }

    private function matchPath(string $routePath, string $requestPath): bool
    {
        $routePattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $routePath);
        $routePattern = '#^' . $routePattern . '$#';
        return preg_match($routePattern, $requestPath);
    }

    private function extractParams(string $routePath, string $requestPath): array
    {
        $routeParts = explode('/', trim($routePath, '/'));
        $requestParts = explode('/', trim($requestPath, '/'));
        $params = [];

        for ($i = 0; $i < count($routeParts); $i++) {
            if (preg_match('/\{([^}]+)\}/', $routeParts[$i], $matches)) {
                $paramName = $matches[1];
                $params[$paramName] = $requestParts[$i] ?? null;
            }
        }

        return $params;
    }

    private function executeRoute(array $route, array $params): void
    {
        [$controllerClass, $method] = explode('@', $route['handler']);
        $controllerClass = "App\\Controllers\\{$controllerClass}";

        if (!class_exists($controllerClass)) {
            throw new \Exception("Controller {$controllerClass} not found");
        }

        $controller = new $controllerClass();
        
        if (!method_exists($controller, $method)) {
            throw new \Exception("Method {$method} not found in {$controllerClass}");
        }

        // Execute middleware (if any)
        foreach ($route['middleware'] as $middlewareClass) {
            // Implement middleware logic here if needed
        }

        // Call the controller method with parameters
        call_user_func_array([$controller, $method], $params);
    }
}
