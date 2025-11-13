<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Expense;
use App\Models\Trip;
use App\Models\ExpenseCategory;

class ExpenseController extends Controller
{
    private $expenseModel;
    private $tripModel;
    private $categoryModel;

    public function __construct()
    {
        $this->expenseModel = new Expense();
        $this->tripModel = new Trip();
        $this->categoryModel = new ExpenseCategory();
    }

    public function index(string $tripId): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        try {
            $expenses = $this->expenseModel->getTripExpenses($tripId);
            $this->successResponse($expenses);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve expenses: ' . $e->getMessage(), 500);
        }
    }

    public function show(string $tripId, string $id): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;
        $expenseId = (int) $id;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        try {
            $expense = $this->expenseModel->findWithDetails($expenseId);
            
            if (!$expense || $expense['trip_id'] != $tripId) {
                $this->errorResponse('Expense not found', 404);
            }

            $this->successResponse($expense);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve expense: ' . $e->getMessage(), 500);
        }
    }

    public function store(string $tripId): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Validation
        $errors = $this->validateRequired($data, ['description', 'amount', 'category_id', 'paid_by', 'expense_date']);

        // Validate amount
        if (!empty($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] <= 0)) {
            $errors['amount'] = 'Amount must be a valid positive number.';
        }

        // Validate category exists
        if (!empty($data['category_id'])) {
            $category = $this->categoryModel->find($data['category_id']);
            if (!$category) {
                $errors['category_id'] = 'Invalid expense category selected.';
            }
        }

        // Validate date
        if (!empty($data['expense_date'])) {
            $date = strtotime($data['expense_date']);
            if ($date === false) {
                $errors['expense_date'] = 'Invalid expense date format.';
            }
        }

        if (!empty($errors)) {
            $this->errorResponse('Validation failed', 422, $errors);
        }

        try {
            // Handle paid_by field - it can be a user ID or a participant ID (prefixed with 'p')
            if (isset($data['paid_by'])) {
                $paidBy = $data['paid_by'];
                if (is_string($paidBy) && strpos($paidBy, 'p') === 0) {
                    // This is a participant ID, extract the numeric part
                    $participantId = (int) substr($paidBy, 1);
                    // Verify the participant exists and belongs to this trip
                    if (!$this->tripModel->participantExists($tripId, $participantId)) {
                        $this->errorResponse('Invalid participant selected for paid_by', 422);
                    }
                    $data['paid_by'] = $participantId;
                } else {
                    // This should be a user ID, verify it exists
                    $data['paid_by'] = (int) $paidBy;
                }
            }
            
            // Add required fields
            $data['trip_id'] = $tripId;
            $data['user_id'] = $user['id'];
            
            // Set default currency if not provided
            if (empty($data['currency'])) {
                $trip = $this->tripModel->find($tripId);
                $data['currency'] = $trip['currency'] ?? 'MYR';
            }

            $expenseId = $this->expenseModel->create($data);
            $expense = $this->expenseModel->findWithDetails($expenseId);

            $this->successResponse($expense, 'Expense created successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to create expense: ' . $e->getMessage(), 500);
        }
    }

    public function update(string $tripId, string $id): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;
        $expenseId = (int) $id;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        $expense = $this->expenseModel->find($expenseId);
        
        if (!$expense || $expense['trip_id'] != $tripId) {
            $this->errorResponse('Expense not found', 404);
        }

        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Remove fields that shouldn't be updated directly
        unset($data['id'], $data['trip_id'], $data['user_id'], $data['created_at'], $data['updated_at']);

        // Validate amount if provided
        if (isset($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] <= 0)) {
            $this->errorResponse('Amount must be a valid positive number.', 422);
        }

        // Validate category if provided
        if (!empty($data['category_id'])) {
            $category = $this->categoryModel->find($data['category_id']);
            if (!$category) {
                $this->errorResponse('Invalid expense category selected.', 422);
            }
        }

        // Validate date if provided
        if (!empty($data['expense_date'])) {
            $date = strtotime($data['expense_date']);
            if ($date === false) {
                $this->errorResponse('Invalid expense date format.', 422);
            }
        }

        try {
            // Handle paid_by field - it can be a user ID or a participant ID (prefixed with 'p')
            if (isset($data['paid_by'])) {
                $paidBy = $data['paid_by'];
                if (is_string($paidBy) && strpos($paidBy, 'p') === 0) {
                    // This is a participant ID, extract the numeric part
                    $participantId = (int) substr($paidBy, 1);
                    // Verify the participant exists and belongs to this trip
                    if (!$this->tripModel->participantExists($tripId, $participantId)) {
                        $this->errorResponse('Invalid participant selected for paid_by', 422);
                    }
                    $data['paid_by'] = $participantId;
                } else {
                    // This should be a user ID, verify it exists
                    $data['paid_by'] = (int) $paidBy;
                }
            }
            
            $this->expenseModel->update($expenseId, $data);
            $expense = $this->expenseModel->findWithDetails($expenseId);

            $this->successResponse($expense, 'Expense updated successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to update expense: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(string $tripId, string $id): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;
        $expenseId = (int) $id;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        $expense = $this->expenseModel->find($expenseId);
        
        if (!$expense || $expense['trip_id'] != $tripId) {
            $this->errorResponse('Expense not found', 404);
        }

        try {
            $this->expenseModel->delete($expenseId);
            $this->successResponse([], 'Expense deleted successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to delete expense: ' . $e->getMessage(), 500);
        }
    }

    public function byCategory(string $tripId): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        try {
            $categoryId = $_GET['category_id'] ?? null;
            
            if ($categoryId) {
                $expenses = $this->expenseModel->getExpensesByCategory($tripId, (int) $categoryId);
            } else {
                $expenses = $this->expenseModel->getSummaryByCategory($tripId);
            }

            $this->successResponse($expenses);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve expenses by category: ' . $e->getMessage(), 500);
        }
    }

    public function cashFlow(string $tripId): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        try {
            $cashFlowData = $this->tripModel->getCashFlowData($tripId);
            $dailyExpenses = $this->expenseModel->getDailyExpenses($tripId);
            $monthlyExpenses = $this->expenseModel->getMonthlyExpenses($tripId);

            $response = [
                'cash_flow' => $cashFlowData,
                'daily_expenses' => $dailyExpenses,
                'monthly_expenses' => $monthlyExpenses
            ];

            $this->successResponse($response);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve cash flow data: ' . $e->getMessage(), 500);
        }
    }

    public function dateRange(string $tripId): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $tripId;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;

        if (!$startDate || !$endDate) {
            $this->errorResponse('Start date and end date are required', 422);
        }

        try {
            $expenses = $this->expenseModel->getExpensesByDateRange($tripId, $startDate, $endDate);
            $this->successResponse($expenses);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve expenses by date range: ' . $e->getMessage(), 500);
        }
    }
}
