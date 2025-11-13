<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Trip;
use App\Models\Destination;

class TripController extends Controller
{
    private $tripModel;
    private $destinationModel;

    public function __construct()
    {
        $this->tripModel = new Trip();
        $this->destinationModel = new Destination();
    }

    public function index(): void
    {
        $user = $this->requireAuth();

        try {
            $trips = $this->tripModel->getUserTrips($user['id']);
            $this->successResponse($trips);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve trips: ' . $e->getMessage(), 500);
        }
    }

    public function show(string $id): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $id;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        try {
            $trip = $this->tripModel->findWithDestination($tripId);
            
            if (!$trip) {
                $this->errorResponse('Trip not found', 404);
            }

            // Get additional trip data
            $trip['total_expenses'] = $this->tripModel->getTotalExpenses($tripId);
            $trip['expenses_by_category'] = $this->tripModel->getExpensesByCategory($tripId);
            $trip['cash_flow_data'] = $this->tripModel->getCashFlowData($tripId);
            $trip['participants'] = $this->tripModel->getParticipants($tripId);

            $this->successResponse($trip);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve trip: ' . $e->getMessage(), 500);
        }
    }

    public function store(): void
    {
        $user = $this->requireAuth();
        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Validation
        $errors = $this->validateRequired($data, ['name', 'destination_id', 'start_date', 'end_date']);

        // Validate dates
        if (!empty($data['start_date']) && !empty($data['end_date'])) {
            $startDate = strtotime($data['start_date']);
            $endDate = strtotime($data['end_date']);
            
            if ($startDate === false) {
                $errors['start_date'] = 'Invalid start date format.';
            }
            
            if ($endDate === false) {
                $errors['end_date'] = 'Invalid end date format.';
            }
            
            if ($startDate && $endDate && $startDate > $endDate) {
                $errors['end_date'] = 'End date must be after start date.';
            }
        }

        // Validate destination exists
        if (!empty($data['destination_id'])) {
            $destination = $this->destinationModel->find($data['destination_id']);
            if (!$destination) {
                $errors['destination_id'] = 'Invalid destination selected.';
            }
        }

        // Validate budget if provided
        if (!empty($data['budget']) && (!is_numeric($data['budget']) || $data['budget'] < 0)) {
            $errors['budget'] = 'Budget must be a valid positive number.';
        }

        if (!empty($errors)) {
            $this->errorResponse('Validation failed', 422, $errors);
        }

        try {
            // Add user_id to data
            $data['user_id'] = $user['id'];
            
            // Set default values
            if (empty($data['currency'])) {
                $data['currency'] = $user['preferred_currency'] ?? 'MYR';
            }
            
            if (empty($data['status'])) {
                $data['status'] = 'planning';
            }

            $tripId = $this->tripModel->create($data);
            
            // Add creator as owner participant
            $this->tripModel->addParticipant($tripId, $user['id'], 'owner');
            
            $trip = $this->tripModel->findWithDestination($tripId);

            $this->successResponse($trip, 'Trip created successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to create trip: ' . $e->getMessage(), 500);
        }
    }

    public function update(string $id): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $id;

        // Check if user has access to this trip
        if (!$this->tripModel->isUserAuthorized($tripId, $user['id'])) {
            $this->errorResponse('Trip not found or access denied', 404);
        }

        $data = $this->getJsonInput();
        $data = $this->sanitizeInput($data);

        // Remove fields that shouldn't be updated directly
        unset($data['id'], $data['user_id'], $data['created_at'], $data['updated_at']);

        // Validate dates if provided
        if (!empty($data['start_date']) || !empty($data['end_date'])) {
            $trip = $this->tripModel->find($tripId);
            $startDate = strtotime($data['start_date'] ?? $trip['start_date']);
            $endDate = strtotime($data['end_date'] ?? $trip['end_date']);
            
            if ($startDate && $endDate && $startDate > $endDate) {
                $this->errorResponse('End date must be after start date.', 422);
            }
        }

        // Validate destination if provided
        if (!empty($data['destination_id'])) {
            $destination = $this->destinationModel->find($data['destination_id']);
            if (!$destination) {
                $this->errorResponse('Invalid destination selected.', 422);
            }
        }

        // Validate budget if provided
        if (isset($data['budget']) && (!is_numeric($data['budget']) || $data['budget'] < 0)) {
            $this->errorResponse('Budget must be a valid positive number.', 422);
        }

        try {
            $this->tripModel->update($tripId, $data);
            $trip = $this->tripModel->findWithDestination($tripId);

            $this->successResponse($trip, 'Trip updated successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to update trip: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(string $id): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $id;

        $trip = $this->tripModel->find($tripId);
        
        if (!$trip) {
            $this->errorResponse('Trip not found', 404);
        }

        // Only trip owner can delete the trip
        if ($trip['user_id'] != $user['id']) {
            $this->errorResponse('Only trip owner can delete this trip', 403);
        }

        try {
            $this->tripModel->delete($tripId);
            $this->successResponse([], 'Trip deleted successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to delete trip: ' . $e->getMessage(), 500);
        }
    }

    public function addParticipant(string $id): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $id;
        $data = $this->getJsonInput();

        $trip = $this->tripModel->find($tripId);
        
        if (!$trip) {
            $this->errorResponse('Trip not found', 404);
        }

        // Only trip owner can add participants
        if ($trip['user_id'] != $user['id']) {
            $this->errorResponse('Only trip owner can add participants', 403);
        }

        // Validate input - either user_id or participant_name is required
        if (empty($data['user_id']) && empty($data['participant_name'])) {
            $this->errorResponse('Either user_id or participant_name is required', 422);
        }

        try {
            $role = $data['role'] ?? 'participant';
            
            if (!empty($data['user_id'])) {
                // Adding a registered user
                $this->tripModel->addParticipant($tripId, (int)$data['user_id'], '', $role);
            } else {
                // Adding a guest participant by name
                $participantName = trim($data['participant_name']);
                if (empty($participantName)) {
                    $this->errorResponse('Participant name cannot be empty', 422);
                }
                $this->tripModel->addParticipant($tripId, null, $participantName, $role);
            }
            
            $participants = $this->tripModel->getParticipants($tripId);
            $this->successResponse($participants, 'Participant added successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to add participant: ' . $e->getMessage(), 500);
        }
    }

    public function removeParticipant(string $id, string $participantId): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $id;
        $participantIdInt = (int) $participantId;

        $trip = $this->tripModel->find($tripId);
        
        if (!$trip) {
            $this->errorResponse('Trip not found', 404);
        }

        // Only trip owner can remove participants
        if ($trip['user_id'] != $user['id']) {
            $this->errorResponse('Access denied', 403);
        }

        try {
            $this->tripModel->removeParticipant($tripId, $participantIdInt);
            
            $participants = $this->tripModel->getParticipants($tripId);
            $this->successResponse($participants, 'Participant removed successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to remove participant: ' . $e->getMessage(), 500);
        }
    }

    public function updateParticipant(string $id, string $participantId): void
    {
        $user = $this->requireAuth();
        $tripId = (int) $id;
        $participantIdInt = (int) $participantId;
        $data = $this->getJsonInput();

        $trip = $this->tripModel->find($tripId);
        
        if (!$trip) {
            $this->errorResponse('Trip not found', 404);
        }

        // Only trip owner can update participants
        if ($trip['user_id'] != $user['id']) {
            $this->errorResponse('Access denied', 403);
        }

        // Validate input
        if (empty($data['participant_name'])) {
            $this->errorResponse('Participant name is required', 422);
        }

        $participantName = trim($data['participant_name']);
        if (empty($participantName)) {
            $this->errorResponse('Participant name cannot be empty', 422);
        }

        try {
            $this->tripModel->updateParticipant($tripId, $participantIdInt, $participantName);
            
            $participants = $this->tripModel->getParticipants($tripId);
            $this->successResponse($participants, 'Participant updated successfully');
        } catch (\Exception $e) {
            $this->errorResponse('Failed to update participant: ' . $e->getMessage(), 500);
        }
    }
}
