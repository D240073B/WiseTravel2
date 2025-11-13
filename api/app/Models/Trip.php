<?php

namespace App\Models;

use App\Core\Model;

class Trip extends Model
{
    protected $table = 'trips';
    protected $fillable = ['user_id', 'name', 'destination_id', 'start_date', 'end_date', 'budget', 'currency', 'description', 'status'];

    public function findWithDestination(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT t.*, d.name as destination_name, d.country, d.description as destination_description
            FROM trips t
            LEFT JOIN destinations d ON t.destination_id = d.id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function getUserTrips(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT t.*, d.name as destination_name, d.country,
                   COALESCE(SUM(e.amount), 0) as total_expenses,
                   COUNT(DISTINCT e.id) as expense_count
            FROM trips t
            LEFT JOIN destinations d ON t.destination_id = d.id
            LEFT JOIN expenses e ON t.id = e.trip_id
            WHERE t.user_id = ?
            GROUP BY t.id
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function getExpenses(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
                   u.name as paid_by_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN users u ON e.paid_by = u.id
            WHERE e.trip_id = ?
            ORDER BY e.expense_date DESC, e.created_at DESC
        ");
        $stmt->execute([$tripId]);
        return $stmt->fetchAll();
    }

    public function getTotalExpenses(int $tripId): float
    {
        $stmt = $this->db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE trip_id = ?");
        $stmt->execute([$tripId]);
        $result = $stmt->fetch();
        return (float) $result['total'];
    }

    public function getExpensesByCategory(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT ec.name, ec.icon, ec.color, 
                   COALESCE(SUM(e.amount), 0) as total_amount,
                   COUNT(e.id) as expense_count
            FROM expense_categories ec
            LEFT JOIN expenses e ON ec.id = e.category_id AND e.trip_id = ?
            GROUP BY ec.id, ec.name, ec.icon, ec.color
            ORDER BY total_amount DESC
        ");
        $stmt->execute([$tripId]);
        return $stmt->fetchAll();
    }

    public function getCashFlowData(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT DATE(expense_date) as date,
                   SUM(amount) as daily_total,
                   COUNT(*) as transaction_count
            FROM expenses
            WHERE trip_id = ?
            GROUP BY DATE(expense_date)
            ORDER BY date ASC
        ");
        $stmt->execute([$tripId]);
        $results = $stmt->fetchAll();

        // Calculate running totals
        $runningTotal = 0;
        foreach ($results as &$row) {
            $runningTotal += $row['daily_total'];
            $row['cumulative_total'] = $runningTotal;
        }

        return $results;
    }

    public function getParticipants(int $tripId): array
    {
        // Get all participants including guest participants
        $stmt = $this->db->prepare("
            SELECT tp.id, tp.user_id, 
                   COALESCE(u.name, tp.participant_name) as participant_name,
                   tp.role, u.email
            FROM trip_participants tp
            LEFT JOIN users u ON tp.user_id = u.id
            WHERE tp.trip_id = ?
            ORDER BY tp.role DESC, COALESCE(u.name, tp.participant_name) ASC
        ");
        $stmt->execute([$tripId]);
        $participants = $stmt->fetchAll();
        
        // If no participants found, include the trip owner
        if (empty($participants)) {
            $stmt = $this->db->prepare("
                SELECT 0 as id, t.user_id, u.name as participant_name, 'owner' as role, u.email
                FROM trips t
                JOIN users u ON t.user_id = u.id
                WHERE t.id = ?
            ");
            $stmt->execute([$tripId]);
            $owner = $stmt->fetch();
            
            if ($owner) {
                $participants = [$owner];
            }
        }
        
        return $participants;
    }

    public function addParticipant(int $tripId, ?int $userId = null, string $participantName = '', string $role = 'participant'): bool
    {
        if ($userId) {
            // Adding a registered user
            $stmt = $this->db->prepare("
                INSERT INTO trip_participants (trip_id, user_id, participant_name, role) 
                VALUES (?, ?, (SELECT name FROM users WHERE id = ?), ?)
                ON DUPLICATE KEY UPDATE role = VALUES(role)
            ");
            return $stmt->execute([$tripId, $userId, $userId, $role]);
        } else {
            // Adding a guest participant by name
            $stmt = $this->db->prepare("
                INSERT INTO trip_participants (trip_id, user_id, participant_name, role) 
                VALUES (?, NULL, ?, ?)
            ");
            return $stmt->execute([$tripId, $participantName, $role]);
        }
    }

    public function removeParticipant(int $tripId, int $participantId): bool
    {
        // Remove by participant ID (from trip_participants table)
        $stmt = $this->db->prepare("DELETE FROM trip_participants WHERE trip_id = ? AND id = ?");
        return $stmt->execute([$tripId, $participantId]);
    }

    public function updateParticipant(int $tripId, int $participantId, string $participantName): bool
    {
        // Update participant name (only for guest participants)
        $stmt = $this->db->prepare("
            UPDATE trip_participants 
            SET participant_name = ? 
            WHERE trip_id = ? AND id = ? AND user_id IS NULL
        ");
        return $stmt->execute([$participantName, $tripId, $participantId]);
    }

    public function isUserAuthorized(int $tripId, int $userId): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM trips t
            LEFT JOIN trip_participants tp ON t.id = tp.trip_id
            WHERE t.id = ? AND (t.user_id = ? OR tp.user_id = ?)
        ");
        $stmt->execute([$tripId, $userId, $userId]);
        return $stmt->fetchColumn() > 0;
    }

    public function participantExists(int $tripId, int $participantId): bool
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM trip_participants WHERE trip_id = ? AND id = ?");
        $stmt->execute([$tripId, $participantId]);
        return $stmt->fetchColumn() > 0;
    }
}
