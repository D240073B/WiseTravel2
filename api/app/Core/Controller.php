<?php

namespace App\Core;

abstract class Controller
{
    protected function jsonResponse(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    protected function errorResponse(string $message, int $statusCode = 400, array $errors = []): void
    {
        $response = [
            'success' => false,
            'message' => $message
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        $this->jsonResponse($response, $statusCode);
    }

    protected function successResponse(array $data = [], string $message = 'Success'): void
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data
        ];

        $this->jsonResponse($response);
    }

    protected function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        return $data ?? [];
    }

    protected function validateRequired(array $data, array $required): array
    {
        $errors = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $errors[$field] = "The {$field} field is required.";
            }
        }
        return $errors;
    }

    protected function validateEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    protected function sanitizeInput(array $data): array
    {
        return array_map(function($value) {
            return is_string($value) ? trim(strip_tags($value)) : $value;
        }, $data);
    }

    protected function getCurrentUser(): ?array
    {
        // Ensure session is started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return null;
        }

        $userModel = new \App\Models\User();
        return $userModel->find($_SESSION['user_id']);
    }

    protected function requireAuth(): array
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            $this->errorResponse('Authentication required', 401);
        }
        return $user;
    }
}
