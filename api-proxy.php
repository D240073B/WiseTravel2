<?php
/**
 * Enhanced API Proxy for WiseTravel2 with Session Management
 */

// Start session first to maintain state
session_start();

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the API path from query parameter
$apiPath = $_GET['path'] ?? '/health';

// Build the target URL
$apiUrl = 'http://localhost:8000' . $apiPath;

// Get query parameters (excluding 'path')
$queryParams = $_GET;
unset($queryParams['path']);
if (!empty($queryParams)) {
    $apiUrl .= '?' . http_build_query($queryParams);
}

// Get the request method and body
$method = $_SERVER['REQUEST_METHOD'];
$requestBody = file_get_contents('php://input');

// Make the request using cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Requested-With: XMLHttpRequest'
]);

if (in_array($method, ['POST', 'PUT', 'PATCH']) && !empty($requestBody)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
}

// Forward all cookies from current session, including the PHP session ID
$cookieString = '';
if (isset($_SERVER['HTTP_COOKIE'])) {
    $cookieString = $_SERVER['HTTP_COOKIE'];
} else {
    // Ensure session cookie is sent
    $sessionName = session_name();
    $sessionId = session_id();
    $cookieString = "{$sessionName}={$sessionId}";
}

if (!empty($cookieString)) {
    curl_setopt($ch, CURLOPT_COOKIE, $cookieString);
}

// Enable cookie jar to capture response cookies
curl_setopt($ch, CURLOPT_COOKIEJAR, '');
curl_setopt($ch, CURLOPT_COOKIEFILE, '');

// Capture response headers
$responseHeaders = [];
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$responseHeaders) {
    $len = strlen($header);
    $header = explode(':', $header, 2);
    
    if (count($header) < 2) {
        return $len;
    }
    
    $name = strtolower(trim($header[0]));
    $value = trim($header[1]);
    
    // Store important headers to forward
    if (in_array($name, ['set-cookie', 'content-type', 'cache-control'])) {
        $responseHeaders[$name] = $value;
    }
    
    return $len;
});

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Forward response headers to client
foreach ($responseHeaders as $name => $value) {
    header("$name: $value");
}

// Handle response
if ($error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error: ' . $error]);
} else {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo $response;
}
?>
