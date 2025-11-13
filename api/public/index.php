<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Database;
use App\Core\Router;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Start session only if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set CORS headers for cross-origin requests
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set content type
header('Content-Type: application/json');

// Error handling
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function($exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $_ENV['APP_DEBUG'] === 'true' ? $exception->getMessage() : 'Internal server error',
        'file' => $_ENV['APP_DEBUG'] === 'true' ? $exception->getFile() : null,
        'line' => $_ENV['APP_DEBUG'] === 'true' ? $exception->getLine() : null
    ]);
});

try {
    // Initialize database and create tables
    $database = Database::getInstance();
    $database->createTables();
    $database->seedInitialData();

    // Initialize router and define routes
    $router = new Router();

    // Health check
    $router->get('/health', 'GeneralController@health');

    // Authentication routes
    $router->post('/auth/register', 'AuthController@register');
    $router->post('/auth/login', 'AuthController@login');
    $router->post('/auth/logout', 'AuthController@logout');
    $router->get('/auth/user', 'AuthController@getUser');
    $router->put('/auth/user', 'AuthController@updateUser');
    $router->post('/auth/change-password', 'AuthController@changePassword');

    // Destination routes
    $router->get('/destinations', 'GeneralController@destinations');
    $router->get('/destinations/{id}', 'GeneralController@destination');

    // Expense category routes
    $router->get('/expense-categories', 'GeneralController@expenseCategories');

    // Trip routes
    $router->get('/trips', 'TripController@index');
    $router->get('/trips/{id}', 'TripController@show');
    $router->post('/trips', 'TripController@store');
    $router->put('/trips/{id}', 'TripController@update');
    $router->delete('/trips/{id}', 'TripController@destroy');

    // Trip participant routes
    $router->post('/trips/{id}/participants', 'TripController@addParticipant');
    $router->put('/trips/{id}/participants/{participantId}', 'TripController@updateParticipant');
    $router->delete('/trips/{id}/participants/{participantId}', 'TripController@removeParticipant');

    // Expense analytics routes (more specific routes first)
    $router->get('/trips/{tripId}/expenses/category', 'ExpenseController@byCategory');
    $router->get('/trips/{tripId}/expenses/cashflow', 'ExpenseController@cashFlow');
    $router->get('/trips/{tripId}/expenses/date-range', 'ExpenseController@dateRange');

    // Expense routes (general routes after specific ones)
    $router->get('/trips/{tripId}/expenses', 'ExpenseController@index');
    $router->get('/trips/{tripId}/expenses/{id}', 'ExpenseController@show');
    $router->post('/trips/{tripId}/expenses', 'ExpenseController@store');
    $router->put('/trips/{tripId}/expenses/{id}', 'ExpenseController@update');
    $router->delete('/trips/{tripId}/expenses/{id}', 'ExpenseController@destroy');

    // Feedback routes
    $router->get('/feedback', 'FeedbackController@index');
    $router->get('/feedback/{id}', 'FeedbackController@show');
    $router->post('/feedback', 'FeedbackController@store');
    $router->put('/feedback/{id}', 'FeedbackController@update');
    $router->delete('/feedback/{id}', 'FeedbackController@destroy');
    $router->get('/feedback-stats', 'FeedbackController@statistics');

    // General stats
    $router->get('/stats', 'GeneralController@stats');

    // Run the router
    $router->run();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $_ENV['APP_DEBUG'] === 'true' ? $e->getMessage() : 'Internal server error'
    ]);
}
