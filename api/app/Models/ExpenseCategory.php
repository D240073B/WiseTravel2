<?php

namespace App\Models;

use App\Core\Model;

class ExpenseCategory extends Model
{
    protected $table = 'expense_categories';
    protected $fillable = ['name', 'icon', 'color'];

    public function getWithExpenseCount(int $tripId): array
    {
        $stmt = $this->db->prepare("
            SELECT ec.*, COUNT(e.id) as expense_count, COALESCE(SUM(e.amount), 0) as total_amount
            FROM expense_categories ec
            LEFT JOIN expenses e ON ec.id = e.category_id AND e.trip_id = ?
            GROUP BY ec.id
            ORDER BY ec.name ASC
        ");
        $stmt->execute([$tripId]);
        return $stmt->fetchAll();
    }

    public function getMostUsedCategories(int $limit = 5): array
    {
        $stmt = $this->db->prepare("
            SELECT ec.*, COUNT(e.id) as usage_count
            FROM expense_categories ec
            LEFT JOIN expenses e ON ec.id = e.category_id
            GROUP BY ec.id
            ORDER BY usage_count DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
}
