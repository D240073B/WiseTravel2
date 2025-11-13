<?php

namespace App\Models;

use App\Core\Model;

class Destination extends Model
{
    protected $table = 'destinations';
    protected $fillable = ['name', 'country', 'description', 'image_url', 'travel_tips'];

    public function getPopularDestinations(int $limit = 10): array
    {
        $stmt = $this->db->prepare("
            SELECT d.*, COUNT(t.id) as trip_count
            FROM destinations d
            LEFT JOIN trips t ON d.id = t.destination_id
            GROUP BY d.id
            ORDER BY trip_count DESC, d.name ASC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function searchDestinations(string $query): array
    {
        $searchTerm = "%{$query}%";
        $stmt = $this->db->prepare("
            SELECT * FROM destinations
            WHERE name LIKE ? OR country LIKE ? OR description LIKE ?
            ORDER BY name ASC
        ");
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
        return $stmt->fetchAll();
    }

    public function getDestinationStats(int $destinationId): array
    {
        $stats = [];

        // Total trips to this destination
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM trips WHERE destination_id = ?");
        $stmt->execute([$destinationId]);
        $stats['total_trips'] = (int) $stmt->fetchColumn();

        // Average budget for trips to this destination
        $stmt = $this->db->prepare("SELECT AVG(budget) as average FROM trips WHERE destination_id = ? AND budget > 0");
        $stmt->execute([$destinationId]);
        $result = $stmt->fetch();
        $stats['average_budget'] = (float) ($result['average'] ?? 0);

        // Most popular months for visiting
        $stmt = $this->db->prepare("
            SELECT MONTH(start_date) as month, COUNT(*) as count
            FROM trips
            WHERE destination_id = ?
            GROUP BY MONTH(start_date)
            ORDER BY count DESC
            LIMIT 3
        ");
        $stmt->execute([$destinationId]);
        $stats['popular_months'] = $stmt->fetchAll();

        return $stats;
    }
}
