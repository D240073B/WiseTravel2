<?php
// Database configuration
$host = 'localhost';
$dbname = 'wisetravel2';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully.\n";
    
    // Check foreign keys on expenses table
    $fkQuery = $pdo->query("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = '$dbname' 
        AND TABLE_NAME = 'expenses' 
        AND COLUMN_NAME = 'paid_by'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    ");
    $foreignKeys = $fkQuery->fetchAll(PDO::FETCH_COLUMN);
    echo "Found foreign keys on expenses.paid_by: " . implode(', ', $foreignKeys) . "\n";
    
    // Drop the foreign key constraint on paid_by
    foreach ($foreignKeys as $fkName) {
        try {
            $pdo->exec("ALTER TABLE expenses DROP FOREIGN KEY $fkName");
            echo "Dropped foreign key: $fkName\n";
        } catch (Exception $e) {
            echo "Could not drop foreign key $fkName: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nDatabase schema updated successfully!\n";
    echo "The paid_by field can now reference either users or participants.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
