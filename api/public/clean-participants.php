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

echo "=== CLEANING UP CROSS-USER PARTICIPANT CONTAMINATION ===\n";

// Method 1: Find participants who are in trips they don't own (except the actual trip owner)
$stmt = $pdo->query("
    SELECT tp.id as participant_record_id, tp.trip_id, tp.user_id as participant_user_id, 
           tp.participant_name, tp.role,
           t.user_id as trip_owner_id, t.name as trip_name,
           u1.email as participant_email, u2.email as trip_owner_email
    FROM trip_participants tp
    INNER JOIN trips t ON tp.trip_id = t.id
    LEFT JOIN users u1 ON tp.user_id = u1.id
    LEFT JOIN users u2 ON t.user_id = u2.id
    WHERE tp.user_id IS NOT NULL 
    AND tp.user_id != t.user_id
    ORDER BY tp.id
");

$problematicParticipants = $stmt->fetchAll();

echo "Found " . count($problematicParticipants) . " participants in trips they don't own:\n\n";

foreach ($problematicParticipants as $p) {
    echo "ISSUE: Participant record {$p['participant_record_id']}\n";
    echo "  - Trip: '{$p['trip_name']}' (ID: {$p['trip_id']}) owned by USER {$p['trip_owner_id']} ({$p['trip_owner_email']})\n";
    echo "  - Has participant: USER {$p['participant_user_id']} {$p['participant_name']} ({$p['participant_email']}) as {$p['role']}\n";
    echo "  - This is cross-contamination!\n\n";
}

// Method 2: Ensure each trip only has its owner as a participant
echo "=== CORRECTING PARTICIPANT DATA ===\n";

// Get all trips and their owners
$stmt = $pdo->query("SELECT id, name, user_id FROM trips ORDER BY id");
$trips = $stmt->fetchAll();

foreach ($trips as $trip) {
    echo "Processing Trip {$trip['id']}: '{$trip['name']}' (Owner: User {$trip['user_id']})\n";
    
    // Remove all participants who are not the trip owner
    $stmt = $pdo->prepare("DELETE FROM trip_participants WHERE trip_id = ? AND user_id != ?");
    $deleted = $stmt->execute([$trip['id'], $trip['user_id']]);
    $affectedRows = $stmt->rowCount();
    
    if ($affectedRows > 0) {
        echo "  - Removed {$affectedRows} cross-contaminated participants\n";
    }
    
    // Ensure the trip owner is added as owner if not already present
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO trip_participants (trip_id, user_id, participant_name, role) 
        SELECT ?, ?, name, 'owner' FROM users WHERE id = ?
    ");
    $stmt->execute([$trip['id'], $trip['user_id'], $trip['user_id']]);
    
    if ($stmt->rowCount() > 0) {
        echo "  - Added trip owner as participant\n";
    }
}

echo "\n=== FINAL STATE CHECK ===\n";
$stmt = $pdo->query("
    SELECT t.id, t.name as trip_name, t.user_id as owner_id, u_owner.email as owner_email,
           COUNT(tp.id) as participant_count
    FROM trips t 
    LEFT JOIN users u_owner ON t.user_id = u_owner.id
    LEFT JOIN trip_participants tp ON t.id = tp.trip_id
    GROUP BY t.id
    ORDER BY t.id DESC
");
$trips = $stmt->fetchAll();

foreach ($trips as $trip) {
    echo "Trip {$trip['id']}: '{$trip['trip_name']}' (Owner: {$trip['owner_email']}) - {$trip['participant_count']} participants\n";
    
    // Get all participants for this trip
    $stmt2 = $pdo->prepare("
        SELECT tp.*, u.email as user_email 
        FROM trip_participants tp 
        LEFT JOIN users u ON tp.user_id = u.id 
        WHERE tp.trip_id = ?
    ");
    $stmt2->execute([$trip['id']]);
    $participants = $stmt2->fetchAll();
    
    foreach ($participants as $p) {
        echo "  - {$p['participant_name']} ({$p['user_email']}) - Role: {$p['role']}\n";
    }
}

echo "\nCleanup completed! Each trip now only has its owner as a participant.\n";
?>
