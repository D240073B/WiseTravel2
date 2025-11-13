<?php
require_once '../vendor/autoload.php';
require_once '../app/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    $stmt = $pdo->query('SELECT id, name, email, preferred_currency FROM users ORDER BY id');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo 'Current users in system:' . PHP_EOL;
    foreach ($users as $user) {
        echo 'ID: ' . $user['id'] . ', Name: ' . $user['name'] . ', Email: ' . $user['email'] . ', Currency: ' . $user['preferred_currency'] . PHP_EOL;
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
?>
