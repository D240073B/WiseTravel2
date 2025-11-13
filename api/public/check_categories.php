<?php
require_once '../vendor/autoload.php';
use App\Core\Database;

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->prepare('SELECT * FROM expense_categories ORDER BY id');
    $stmt->execute();
    $categories = $stmt->fetchAll();
    
    echo "Expense Categories in Database:\n";
    foreach ($categories as $cat) {
        echo "ID: " . $cat['id'] . " | Name: " . $cat['name'] . " | Icon: " . $cat['icon'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
