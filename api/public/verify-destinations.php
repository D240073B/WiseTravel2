<?php
require_once '../vendor/autoload.php';
require_once '../app/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== Verification: Current Destinations in Database ===" . PHP_EOL;
    
    $stmt = $db->query("SELECT id, name, LEFT(travel_tips, 50) as tips_preview FROM destinations ORDER BY id");
    $destinations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Total destinations found: " . count($destinations) . PHP_EOL . PHP_EOL;
    
    foreach ($destinations as $dest) {
        echo sprintf("%2d. %-25s %s...", $dest['id'], $dest['name'], $dest['tips_preview']) . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
