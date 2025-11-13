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

echo "=== USER CURRENCIES ===\n";
$users = $pdo->query('SELECT id, name, email, preferred_currency FROM users ORDER BY id DESC LIMIT 5')->fetchAll();
foreach ($users as $user) {
    echo "User {$user['id']}: {$user['name']} ({$user['email']}) - Currency: {$user['preferred_currency']}\n";
}

echo "\n=== TRIP CURRENCIES ===\n";
$trips = $pdo->query('SELECT t.id, t.name, t.currency, t.user_id, u.preferred_currency as user_currency FROM trips t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.id DESC')->fetchAll();
foreach ($trips as $trip) {
    echo "Trip {$trip['id']}: '{$trip['name']}' - Trip Currency: {$trip['currency']}, Owner Currency: {$trip['user_currency']}\n";
}
?>
