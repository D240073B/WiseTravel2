<?php
$pdo = new PDO('mysql:host=localhost;dbname=wisetravel2', 'root', '');
$stmt = $pdo->query('SELECT e.id, e.description, e.paid_by, u.name as user_name FROM expenses e LEFT JOIN users u ON e.paid_by = u.id ORDER BY e.id DESC LIMIT 5');
foreach($stmt->fetchAll() as $exp) {
    echo "Expense {$exp['id']}: {$exp['description']} - Paid by: {$exp['paid_by']} (User: {$exp['user_name']})\n";
}
?>
