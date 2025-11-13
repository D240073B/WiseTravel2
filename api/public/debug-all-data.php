<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=wisetravel2', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check users table
    $stmt = $pdo->query("SELECT id, name, email FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check participants table for trip 3
    $stmt = $pdo->query("SELECT id, user_id, participant_name, role FROM trip_participants WHERE trip_id = 3");
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check expenses for trip 3
    $stmt = $pdo->query("SELECT id, description, paid_by, trip_id FROM expenses WHERE trip_id = 3");
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'participants_trip_3' => $participants,
        'expenses_trip_3' => $expenses
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
