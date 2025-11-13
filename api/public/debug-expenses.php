<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=wisetravel2', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get expense details with participant info
    $stmt = $pdo->query("
        SELECT e.id, e.description, e.paid_by, e.trip_id,
               COALESCE(u.name, tp.participant_name, 'Unknown') as paid_by_name,
               u.name as user_name,
               tp.participant_name as participant_name,
               tp.id as participant_id
        FROM expenses e
        LEFT JOIN users u ON e.paid_by = u.id
        LEFT JOIN trip_participants tp ON e.paid_by = tp.id AND tp.trip_id = e.trip_id
        ORDER BY e.id DESC 
        LIMIT 5
    ");
    
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $expenses
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
