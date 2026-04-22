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
        $city = $request->validated()['city'];

        return response()->json(
            $this->weatherService->getPlannerByCity($city)
        );
    }
}
