<?php
require_once '../vendor/autoload.php';
require_once '../app/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance()->getConnection();

    echo "=== Checking trips with destination data ===" . PHP_EOL;
    $stmt = $db->prepare("
        SELECT t.id, t.name, t.destination_id, d.name as destination_name
        FROM trips t
        LEFT JOIN destinations d ON t.destination_id = d.id
        ORDER BY t.id
    ");
    $stmt->execute();
    $trips = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($trips as $trip) {
        echo "Trip ID: {$trip['id']}, Name: {$trip['name']}, Destination ID: {$trip['destination_id']}, Destination Name: " . ($trip['destination_name'] ?: 'NULL') . PHP_EOL;
    }

    echo PHP_EOL . "=== Checking destinations table ===" . PHP_EOL;
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM destinations");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total destinations: {$result['count']}" . PHP_EOL;

    echo PHP_EOL . "=== Sample destinations ===" . PHP_EOL;
    $stmt = $db->prepare("SELECT id, name FROM destinations ORDER BY id LIMIT 10");
    $stmt->execute();
    $destinations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($destinations as $dest) {
        echo "Destination ID: {$dest['id']}, Name: {$dest['name']}" . PHP_EOL;
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
