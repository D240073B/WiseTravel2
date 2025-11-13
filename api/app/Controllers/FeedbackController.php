<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Feedback;

class FeedbackController extends Controller
{
    private $feedbackModel;

    public function __construct()
    {
        $this->feedbackModel = new Feedback();
    }

    /**
     * Get all feedback for the authenticated user
     */
    public function index(): void
    {
        $user = $this->requireAuth();

        try {
            $feedback = $this->feedbackModel->getUserFeedback($user['id']);
            $this->successResponse($feedback);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve feedback: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a specific feedback entry
     */
    public function show(string $id): void
    {
        $user = $this->requireAuth();
        $feedbackId = (int) $id;

        try {
            $feedback = $this->feedbackModel->findWithDetails($feedbackId);
            
            if (!$feedback) {
                $this->errorResponse('Feedback not found', 404);
            }

            // Check if the feedback belongs to the authenticated user
            if ($feedback['user_id'] != $user['id']) {
                $this->errorResponse('Access denied', 403);
            }

            $this->successResponse($feedback);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve feedback: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create new feedback
     */
    public function store(): void
    {
        $user = $this->requireAuth();
        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Validation
        $errors = $this->validateRequired($data, ['feedback_type', 'subject', 'message']);

        // Validate feedback_type
        $validTypes = ['suggestion', 'question', 'problem'];
        if (!empty($data['feedback_type']) && !in_array($data['feedback_type'], $validTypes)) {
            $errors['feedback_type'] = 'Invalid feedback type. Must be: suggestion, question, or problem.';
        }

        // Validate subject length
        if (!empty($data['subject']) && strlen($data['subject']) > 255) {
            $errors['subject'] = 'Subject must not exceed 255 characters.';
        }

        // Validate message is not empty
        if (!empty($data['message']) && strlen(trim($data['message'])) < 10) {
            $errors['message'] = 'Message must be at least 10 characters long.';
        }

        if (!empty($errors)) {
            $this->errorResponse('Validation failed', 422, $errors);
        }

        try {
            // Add user_id to the data
            $data['user_id'] = $user['id'];
            
            $feedbackId = $this->feedbackModel->create($data);
            $feedback = $this->feedbackModel->findWithDetails($feedbackId);
            
            $this->successResponse($feedback, 'Feedback submitted successfully! We appreciate your input and will review it soon.', 201);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to submit feedback: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update feedback (mainly for status updates)
     */
    public function update(string $id): void
    {
        $user = $this->requireAuth();
        $feedbackId = (int) $id;
        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        try {
            $feedback = $this->feedbackModel->find($feedbackId);
            
            if (!$feedback) {
                $this->errorResponse('Feedback not found', 404);
            }

            // Check if the feedback belongs to the authenticated user
            if ($feedback['user_id'] != $user['id']) {
                $this->errorResponse('Access denied', 403);
            }

            // Users can only update their own feedback content if it's still pending
            if ($feedback['status'] !== 'pending') {
                $this->errorResponse('Cannot update feedback that has been reviewed', 403);
            }

            // Only allow updating certain fields
            $allowedFields = ['subject', 'message', 'feedback_type'];
            $updateData = array_intersect_key($data, array_flip($allowedFields));

            if (empty($updateData)) {
                $this->errorResponse('No valid fields to update', 422);
            }

            // Validate if provided
            if (isset($updateData['feedback_type'])) {
                $validTypes = ['suggestion', 'question', 'problem'];
                if (!in_array($updateData['feedback_type'], $validTypes)) {
                    $this->errorResponse('Invalid feedback type', 422);
                }
            }

            $this->feedbackModel->update($feedbackId, $updateData);
            $updatedFeedback = $this->feedbackModel->findWithDetails($feedbackId);
            
            $this->successResponse($updatedFeedback, 'Feedback updated successfully!');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to update feedback: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete feedback
     */
    public function destroy(string $id): void
    {
        $user = $this->requireAuth();
        $feedbackId = (int) $id;

        try {
            $feedback = $this->feedbackModel->find($feedbackId);
            
            if (!$feedback) {
                $this->errorResponse('Feedback not found', 404);
            }

            // Check if the feedback belongs to the authenticated user
            if ($feedback['user_id'] != $user['id']) {
                $this->errorResponse('Access denied', 403);
            }

            $this->feedbackModel->delete($feedbackId);
            $this->successResponse([], 'Feedback deleted successfully!');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to delete feedback: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get feedback statistics for the user
     */
    public function statistics(): void
    {
        $user = $this->requireAuth();

        try {
            $countByType = $this->feedbackModel->getCountByType($user['id']);
            $totalFeedback = $this->feedbackModel->count(['user_id' => $user['id']]);
            
            $stats = [
                'total' => $totalFeedback,
                'by_type' => $countByType
            ];
            
            $this->successResponse($stats);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve statistics: ' . $e->getMessage(), 500);
        }
    }
}
