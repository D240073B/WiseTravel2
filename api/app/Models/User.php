<?php

namespace App\Models;

use App\Core\Model;

class User extends Model
{
    protected $table = 'users';
    protected $fillable = ['name', 'email', 'password', 'preferred_currency'];

    public function findByEmail(string $email): ?array
    {
        return $this->whereFirst('email', $email);
    }

    public function create(array $data): int
    {
        // Hash password before storing
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        return parent::create($data);
    }

    public function verifyPassword(string $password, string $hashedPassword): bool
    {
        return password_verify($password, $hashedPassword);
    }

    public function updatePassword(int $id, string $newPassword): bool
    {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        return $this->update($id, ['password' => $hashedPassword]);
    }

    public function getTrips(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT t.*, d.name as destination_name, d.country
            FROM trips t
            LEFT JOIN destinations d ON t.destination_id = d.id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function getTotalExpenses(int $userId): float
    {
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(e.amount), 0) as total
            FROM expenses e
            JOIN trips t ON e.trip_id = t.id
            WHERE t.user_id = ?
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        return (float) $result['total'];
    }

    public function getStats(int $userId): array
    {
        $stats = [];

        // Total trips
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM trips WHERE user_id = ?");
        $stmt->execute([$userId]);
        $stats['total_trips'] = (int) $stmt->fetchColumn();

        // Total expenses
        $stats['total_expenses'] = $this->getTotalExpenses($userId);

        // Active trips
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM trips WHERE user_id = ? AND status = 'active'");
        $stmt->execute([$userId]);
        $stats['active_trips'] = (int) $stmt->fetchColumn();

        // Upcoming trips
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM trips WHERE user_id = ? AND start_date > CURDATE()");
        $stmt->execute([$userId]);
        $stats['upcoming_trips'] = (int) $stmt->fetchColumn();

        return $stats;
    }
}
