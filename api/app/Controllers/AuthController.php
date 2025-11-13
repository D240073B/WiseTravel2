<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;

class AuthController extends Controller
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function register(): void
    {
        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Validation
        $errors = $this->validateRequired($data, ['name', 'email', 'password']);

        if (!empty($data['email']) && !$this->validateEmail($data['email'])) {
            $errors['email'] = 'Please provide a valid email address.';
        }

        if (!empty($data['password']) && strlen($data['password']) < 6) {
            $errors['password'] = 'Password must be at least 6 characters long.';
        }

        // Check if email already exists
        if (empty($errors['email']) && $this->userModel->findByEmail($data['email'])) {
            $errors['email'] = 'Email address is already registered.';
        }

        if (!empty($errors)) {
            $this->errorResponse('Validation failed', 422, $errors);
        }

        try {
            // Set default currency if not provided
            if (empty($data['preferred_currency'])) {
                $data['preferred_currency'] = 'MYR';
            }

            $userId = $this->userModel->create($data);
            $user = $this->userModel->find($userId);

            // Remove password from response
            unset($user['password']);

            // Start session only if not already started
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Clear any existing session data before setting new user session
            $_SESSION = [];
            
            $_SESSION['user_id'] = $userId;
            $_SESSION['user_email'] = $user['email'];

            $this->successResponse($user, 'Registration successful');
        } catch (\Exception $e) {
            $this->errorResponse('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    public function login(): void
    {
        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Validation
        $errors = $this->validateRequired($data, ['email', 'password']);

        if (!empty($errors)) {
            $this->errorResponse('Validation failed', 422, $errors);
        }

        try {
            $user = $this->userModel->findByEmail($data['email']);

            if (!$user || !$this->userModel->verifyPassword($data['password'], $user['password'])) {
                $this->errorResponse('Invalid email or passwords->'.$data['email'].":".$data['password'], 401);
            }

            // Remove password from response
            unset($user['password']);

            // Start session only if not already started
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Clear any existing session data before setting new user session
            $_SESSION = [];
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['preferred_currency'] = $user['preferred_currency'];

            // Get user stats
            $stats = $this->userModel->getStats($user['id']);
            $user['stats'] = $stats;

            $this->successResponse($user, 'Login successful');
        } catch (\Exception $e) {
            $this->errorResponse('Login failed: ' . $e->getMessage(), 500);
        }
    }

    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Clear all session variables
        $_SESSION = [];
        
        // Destroy the session cookie if it exists
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        // Finally destroy the session
        session_destroy();
        
        $this->successResponse([], 'Logout successful');
    }

    public function getUser(): void
    {
        $user = $this->getCurrentUser();
        
        if (!$user) {
            $this->errorResponse('No active session', 401);
        }
        
        // Get user stats
        $stats = $this->userModel->getStats($user['id']);
        $user['stats'] = $stats;

        // Remove password from response
        unset($user['password']);

        $this->successResponse($user);
    }

    public function updateUser(): void
    {
        $user = $this->requireAuth();
        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Remove sensitive fields that shouldn't be updated directly
        unset($data['password'], $data['id'], $data['created_at'], $data['updated_at']);

        // Validate email if provided
        if (!empty($data['email'])) {
            if (!$this->validateEmail($data['email'])) {
                $this->errorResponse('Please provide a valid email address.', 422);
            }

            // Check if email is already taken by another user
            $existingUser = $this->userModel->findByEmail($data['email']);
            if ($existingUser && $existingUser['id'] != $user['id']) {
                $this->errorResponse('Email address is already taken.', 422);
            }
        }

        try {
            // Check if currency is being changed
            $currencyChanged = false;
            if (!empty($data['preferred_currency']) && $data['preferred_currency'] !== $user['preferred_currency']) {
                $currencyChanged = true;
                $newCurrency = $data['preferred_currency'];
                error_log("Currency change detected: {$user['preferred_currency']} -> {$newCurrency}");
            }

            $this->userModel->update($user['id'], $data);
            
            // If currency changed, update all user's trips and expenses to use the new currency
            if ($currencyChanged) {
                error_log("Updating trips and expenses with new currency: {$newCurrency}");
                
                $tripModel = new \App\Models\Trip();
                $expenseModel = new \App\Models\Expense();
                
                // Update all user's trips
                $userTrips = $tripModel->getUserTrips($user['id']);
                error_log("Found " . count($userTrips) . " trips to update");
                
                foreach ($userTrips as $trip) {
                    $tripModel->update($trip['id'], ['currency' => $newCurrency]);
                    error_log("Updated trip {$trip['id']} currency to {$newCurrency}");
                    
                    // Update all expenses for this trip
                    $tripExpenses = $expenseModel->getTripExpenses($trip['id']);
                    error_log("Found " . count($tripExpenses) . " expenses for trip {$trip['id']}");
                    
                    foreach ($tripExpenses as $expense) {
                        $expenseModel->update($expense['id'], ['currency' => $newCurrency]);
                        error_log("Updated expense {$expense['id']} currency to {$newCurrency}");
                    }
                }
                
                // Update session with new currency
                if (session_status() === PHP_SESSION_NONE) {
                    session_start();
                }
                $_SESSION['preferred_currency'] = $newCurrency;
                error_log("Updated session currency to: {$newCurrency}");
            }
            
            $updatedUser = $this->userModel->find($user['id']);
            
            // Remove password from response
            unset($updatedUser['password']);

            $this->successResponse($updatedUser, 'Profile updated successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Update failed: ' . $e->getMessage(), 500);
        }
    }

    public function changePassword(): void
    {
        $user = $this->requireAuth();
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validateRequired($data, ['current_password', 'new_password']);

        if (!empty($data['new_password']) && strlen($data['new_password']) < 6) {
            $errors['new_password'] = 'New password must be at least 6 characters long.';
        }

        if (!empty($errors)) {
            $this->errorResponse('Validation failed', 422, $errors);
        }

        // Verify current password
        if (!$this->userModel->verifyPassword($data['current_password'], $user['password'])) {
            $this->errorResponse('Current password is incorrect', 401);
        }

        try {
            $this->userModel->updatePassword($user['id'], $data['new_password']);
            $this->successResponse([], 'Password changed successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Password change failed: ' . $e->getMessage(), 500);
        }
    }
}
