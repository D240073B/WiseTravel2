<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=wisetravel2', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get participants for trip 3 (from our earlier check)
    $stmt = $pdo->prepare("
        SELECT tp.id, tp.user_id, 
               COALESCE(u.name, tp.participant_name) as participant_name,
               tp.role, u.email
        FROM trip_participants tp
        LEFT JOIN users u ON tp.user_id = u.id
        WHERE tp.trip_id = 3
        ORDER BY tp.role DESC, COALESCE(u.name, tp.participant_name) ASC
    ");
    $stmt->execute();
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'trip_id' => 3,
        'participants' => $participants
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
