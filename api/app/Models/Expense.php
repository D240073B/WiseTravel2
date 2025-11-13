<?php

namespace App\Models;

use App\Core\Model;

class Expense extends Model
{
    protected $table = 'expenses';
    protected $fillable = ['trip_id', 'user_id', 'category_id', 'description', 'amount', 'currency', 'paid_by', 'expense_date', 'receipt_url', 'notes'];

    public function findWithDetails(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
                   COALESCE(u.name, tp.participant_name, 'Unknown') as paid_by_name, 
                   creator.name as created_by_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN users u ON e.paid_by = u.id
            LEFT JOIN trip_participants tp ON e.paid_by = tp.id AND tp.trip_id = e.trip_id
            LEFT JOIN users creator ON e.user_id = creator.id
            WHERE e.id = ?
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function getTripExpenses(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
                   COALESCE(u.name, tp.participant_name, 'Unknown') as paid_by_name, 
                   creator.name as created_by_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN users u ON e.paid_by = u.id
            LEFT JOIN trip_participants tp ON e.paid_by = tp.id AND tp.trip_id = e.trip_id
            LEFT JOIN users creator ON e.user_id = creator.id
            WHERE e.trip_id = ?
            ORDER BY e.expense_date DESC, e.created_at DESC
        ");
        $stmt->execute([$tripId]);
        return $stmt->fetchAll();
    }

    public function getExpensesByDateRange(int $tripId, string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
                   u.name as paid_by_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN users u ON e.paid_by = u.id
            WHERE e.trip_id = ? AND e.expense_date BETWEEN ? AND ?
            ORDER BY e.expense_date DESC, e.created_at DESC
        ");
        $stmt->execute([$tripId, $startDate, $endDate]);
        return $stmt->fetchAll();
    }

    public function getExpensesByCategory(int $tripId, int $categoryId): array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
                   u.name as paid_by_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN users u ON e.paid_by = u.id
            WHERE e.trip_id = ? AND e.category_id = ?
            ORDER BY e.expense_date DESC, e.created_at DESC
        ");
        $stmt->execute([$tripId, $categoryId]);
        return $stmt->fetchAll();
    }

    public function getUserExpenses(int $userId, ?int $tripId = null): array
    {
        $sql = "
            SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
                   u.name as paid_by_name, t.name as trip_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN users u ON e.paid_by = u.id
            LEFT JOIN trips t ON e.trip_id = t.id
            WHERE e.user_id = ?
        ";
        
        $params = [$userId];
        
        if ($tripId) {
            $sql .= " AND e.trip_id = ?";
            $params[] = $tripId;
        }
        
        $sql .= " ORDER BY e.expense_date DESC, e.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getSummaryByCategory(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT ec.id, ec.name, ec.icon, ec.color,
                   COALESCE(SUM(e.amount), 0) as total_amount,
                   COUNT(e.id) as expense_count,
                   AVG(e.amount) as average_amount
            FROM expense_categories ec
            LEFT JOIN expenses e ON ec.id = e.category_id AND e.trip_id = ?
            GROUP BY ec.id, ec.name, ec.icon, ec.color
            ORDER BY total_amount DESC
        ");
        $stmt->execute([$tripId]);
        return $stmt->fetchAll();
    }

    public function getMonthlyExpenses(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT DATE_FORMAT(expense_date, '%Y-%m') as month,
                   SUM(amount) as total_amount,
                   COUNT(*) as expense_count
            FROM expenses
            WHERE trip_id = ?
            GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
            ORDER BY month ASC
        ");
        $stmt->execute([$tripId]);
        return $stmt->fetchAll();
    }

    public function getDailyExpenses(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT DATE(expense_date) as date,
                   SUM(amount) as total_amount,
                   COUNT(*) as expense_count
            FROM expenses
            WHERE trip_id = ?
            GROUP BY DATE(expense_date)
            ORDER BY date ASC
        ");
        $stmt->execute([$tripId]);
        return $stmt->fetchAll();
    }

    public function delete(int $id): bool
    {
        // You might want to add soft delete functionality here
        return parent::delete($id);
    }
}
