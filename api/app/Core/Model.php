<?php

namespace App\Core;

abstract class Model
{
    protected $db;
    protected $table;
    protected $fillable = [];

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM {$this->table}");
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function create(array $data): int
    {
        $fields = array_intersect_key($data, array_flip($this->fillable));
        $columns = implode(', ', array_keys($fields));
        $placeholders = ':' . implode(', :', array_keys($fields));

        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($fields);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $fields = array_intersect_key($data, array_flip($this->fillable));
        $setClause = implode(' = ?, ', array_keys($fields)) . ' = ?';

        $sql = "UPDATE {$this->table} SET {$setClause} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        
        $values = array_values($fields);
        $values[] = $id;
        
        return $stmt->execute($values);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function where(string $column, $value): array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$column} = ?");
        $stmt->execute([$value]);
        return $stmt->fetchAll();
    }

    public function whereFirst(string $column, $value): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$column} = ? LIMIT 1");
        $stmt->execute([$value]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
}
