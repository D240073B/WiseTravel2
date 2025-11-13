<?php

namespace App\Models;

use App\Core\Model;

class Feedback extends Model
{
    protected $table = 'feedback';
    protected $fillable = ['user_id', 'feedback_type', 'subject', 'message', 'status'];

    /**
     * Get all feedback for a specific user
     */
    public function getUserFeedback(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT f.*, u.name as user_name, u.email as user_email
            FROM {$this->table} f
            LEFT JOIN users u ON f.user_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    /**
     * Get feedback with user details
     */
    public function findWithDetails(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT f.*, u.name as user_name, u.email as user_email
            FROM {$this->table} f
            LEFT JOIN users u ON f.user_id = u.id
            WHERE f.id = ?
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * Create new feedback
     */
    public function create(array $data): int
    {
        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'pending';
        }

        return parent::create($data);
    }

    /**
     * Update feedback status
     */
    public function updateStatus(int $id, string $status): bool
    {
        return $this->update($id, ['status' => $status]);
    }

    /**
     * Get feedback count by type for a user
     */
    public function getCountByType(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT feedback_type, COUNT(*) as count
            FROM {$this->table}
            WHERE user_id = ?
            GROUP BY feedback_type
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
}
