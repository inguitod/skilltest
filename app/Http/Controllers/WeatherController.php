<?php

namespace App\Http\Controllers;

use App\Http\Requests\WeatherPlannerRequest;
use App\Services\WeatherService;
use Illuminate\Http\JsonResponse;

class WeatherController extends Controller
{
    public function __construct(
        private readonly WeatherService $weatherService,
    ) {}

    public function planner(WeatherPlannerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $city = $validated['city'];
        $forceRefresh = $validated['force_refresh'] ?? false;

        return response()->json(
            $this->weatherService->getPlannerByCity($city, $forceRefresh)
        );
    }
}
