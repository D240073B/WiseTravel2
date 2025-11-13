<?php
require_once '../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$pdo = new PDO(
    "mysql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_NAME']};charset=utf8mb4",
    $_ENV['DB_USER'],
    $_ENV['DB_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

echo "=== TRIP PARTICIPANTS TABLE ===\n";
$stmt = $pdo->query('SELECT tp.*, u.email as user_email, t.name as trip_name, t.user_id as trip_owner FROM trip_participants tp LEFT JOIN users u ON tp.user_id = u.id LEFT JOIN trips t ON tp.trip_id = t.id ORDER BY tp.id DESC LIMIT 10');
$participants = $stmt->fetchAll();
foreach ($participants as $p) {
    echo "ID: {$p['id']}, Trip: {$p['trip_name']} (Owner: {$p['trip_owner']}), Participant: {$p['participant_name']} ({$p['user_email']}), Role: {$p['role']}\n";
}

echo "\n=== RECENT USERS ===\n";
$stmt = $pdo->query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5');
$users = $stmt->fetchAll();
foreach ($users as $u) {
    echo "ID: {$u['id']}, Name: {$u['name']}, Email: {$u['email']}, Created: {$u['created_at']}\n";
}

echo "\n=== TRIPS AND THEIR OWNERS ===\n";
$stmt = $pdo->query('SELECT t.id, t.name, t.user_id, u.email as owner_email FROM trips t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.id DESC LIMIT 5');
$trips = $stmt->fetchAll();
foreach ($trips as $t) {
    echo "Trip ID: {$t['id']}, Name: {$t['name']}, Owner: {$t['user_id']} ({$t['owner_email']})\n";
}
?>
