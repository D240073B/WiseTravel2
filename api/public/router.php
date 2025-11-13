<?php
// Router for PHP built-in server
// This file handles routing for both API and static files

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Serve index.html for root request
if ($uri === '/' || $uri === '/index.html') {
    // Serve the main index.html from parent directory
    $indexPath = __DIR__ . '/../../index.html';
    if (file_exists($indexPath)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($indexPath);
        exit;
    }
}

// Serve static files from parent directory
$staticExtensions = ['css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'woff', 'woff2', 'ttf', 'eot'];
$ext = pathinfo($uri, PATHINFO_EXTENSION);

if (in_array($ext, $staticExtensions)) {
    $filePath = __DIR__ . '/../../' . ltrim($uri, '/');
    if (file_exists($filePath)) {
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject'
        ];
        
        $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
        header("Content-Type: $mimeType");
        readfile($filePath);
        exit;
    }
}

// For API routes, let index.php handle them
require_once __DIR__ . '/index.php';
