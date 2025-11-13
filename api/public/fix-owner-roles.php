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

echo "Updating owner roles...\n";
$stmt = $pdo->prepare('UPDATE trip_participants tp INNER JOIN trips t ON tp.trip_id = t.id SET tp.role = "owner" WHERE tp.user_id = t.user_id');
$stmt->execute();
echo "Updated " . $stmt->rowCount() . " owner roles.\n";

// Check final state
echo "\n=== FINAL PARTICIPANT STATE ===\n";
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
?>
