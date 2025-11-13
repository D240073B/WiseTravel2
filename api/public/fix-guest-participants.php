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
    
    // Step 1: Check current table structure
    echo "Checking current table structure...\n";
    
    // Check foreign keys
    $fkQuery = $pdo->query("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = '$dbname' 
        AND TABLE_NAME = 'trip_participants' 
        AND REFERENCED_TABLE_NAME = 'users'
    ");
    $foreignKeys = $fkQuery->fetchAll(PDO::FETCH_COLUMN);
    echo "Found foreign keys: " . implode(', ', $foreignKeys) . "\n";
    
    // Step 2: Drop existing foreign key constraints if they exist
    foreach ($foreignKeys as $fkName) {
        try {
            $pdo->exec("ALTER TABLE trip_participants DROP FOREIGN KEY $fkName");
            echo "Dropped foreign key: $fkName\n";
        } catch (Exception $e) {
            echo "Could not drop foreign key $fkName: " . $e->getMessage() . "\n";
        }
    }
    
    // Step 3: Check if participant_name column exists
    $columnQuery = $pdo->query("SHOW COLUMNS FROM trip_participants LIKE 'participant_name'");
    if ($columnQuery->rowCount() == 0) {
        $pdo->exec("ALTER TABLE trip_participants ADD COLUMN participant_name VARCHAR(255) NULL");
        echo "Added participant_name column.\n";
    } else {
        echo "participant_name column already exists.\n";
    }
    
    // Step 4: Make user_id nullable
    $pdo->exec("ALTER TABLE trip_participants MODIFY user_id INT NULL");
    echo "Made user_id nullable.\n";
    
    // Step 5: Re-add foreign key constraint
    $pdo->exec("ALTER TABLE trip_participants ADD CONSTRAINT fk_trip_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
    echo "Re-added foreign key constraint.\n";
    
    // Step 6: Handle unique constraint
    try {
        $pdo->exec("ALTER TABLE trip_participants DROP INDEX unique_trip_user");
        echo "Dropped old unique constraint.\n";
    } catch (Exception $e) {
        echo "Old unique constraint not found or already dropped.\n";
    }
    
    // Step 7: Create guest_participants table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS guest_participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
            UNIQUE KEY unique_trip_guest (trip_id, name)
        )
    ");
    echo "Created/ensured guest_participants table exists.\n";
    
    echo "\nDatabase schema updated successfully!\n";
    echo "Guest participants are now supported.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
