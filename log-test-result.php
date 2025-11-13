<?php
// Simple logging script to capture test results
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['message'])) {
        $logFile = __DIR__ . '/currency-test-log.txt';
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$input['message']}\n";
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No message provided']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Only POST method allowed']);
}
?>
