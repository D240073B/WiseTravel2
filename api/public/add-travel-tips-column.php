<?php
require_once '../vendor/autoload.php';
require_once '../app/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== Adding travel_tips column to destinations table ===" . PHP_EOL;
    
    // Check if travel_tips column already exists
    $stmt = $db->prepare("SHOW COLUMNS FROM destinations LIKE 'travel_tips'");
    $stmt->execute();
    $columnExists = $stmt->rowCount() > 0;
    
    if (!$columnExists) {
        // Add travel_tips column
        $db->exec("ALTER TABLE destinations ADD COLUMN travel_tips TEXT AFTER description");
        echo "Successfully added travel_tips column." . PHP_EOL;
    } else {
        echo "travel_tips column already exists." . PHP_EOL;
    }
    
    echo "=== Migration completed ===" . PHP_EOL;
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
