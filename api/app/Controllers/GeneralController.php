<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Destination;
use App\Models\ExpenseCategory;

class GeneralController extends Controller
{
    private $destinationModel;
    private $categoryModel;

    public function __construct()
    {
        $this->destinationModel = new Destination();
        $this->categoryModel = new ExpenseCategory();
    }

    public function destinations(): void
    {
        try {
            $search = $_GET['search'] ?? null;
            $popular = $_GET['popular'] ?? false;

            if ($search) {
                $destinations = $this->destinationModel->searchDestinations($search);
            } elseif ($popular) {
                $destinations = $this->destinationModel->getPopularDestinations(10);
            } else {
                $destinations = $this->destinationModel->findAll();
            }

            $this->successResponse($destinations);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve destinations: ' . $e->getMessage(), 500);
        }
    }

    public function destination(string $id): void
    {
        $destinationId = (int) $id;

        try {
            $destination = $this->destinationModel->find($destinationId);
            
            if (!$destination) {
                $this->errorResponse('Destination not found', 404);
            }

            // Get destination stats
            $stats = $this->destinationModel->getDestinationStats($destinationId);
            $destination['stats'] = $stats;

            $this->successResponse($destination);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve destination: ' . $e->getMessage(), 500);
        }
    }

    public function expenseCategories(): void
    {
        try {
            $tripId = $_GET['trip_id'] ?? null;
            
            if ($tripId) {
                $categories = $this->categoryModel->getWithExpenseCount((int) $tripId);
            } else {
                $categories = $this->categoryModel->findAll();
            }

            $this->successResponse($categories);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve expense categories: ' . $e->getMessage(), 500);
        }
    }

    public function health(): void
    {
        $this->successResponse([
            'status' => 'healthy',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0.0',
            'database' => 'connected'
        ], 'API is running successfully');
    }

    public function stats(): void
    {
        $user = $this->requireAuth();

        try {
            // Get overall stats (you can customize this based on requirements)
            $stats = [
                'total_users' => 0, // You might want to add this functionality
                'total_trips' => 0,
                'total_destinations' => count($this->destinationModel->findAll()),
                'popular_destinations' => $this->destinationModel->getPopularDestinations(5),
                'popular_categories' => $this->categoryModel->getMostUsedCategories(5)
            ];

            $this->successResponse($stats);
        } catch (\Exception $e) {
            $this->errorResponse('Failed to retrieve stats: ' . $e->getMessage(), 500);
        }
    }
}
