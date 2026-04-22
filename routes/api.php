<?php

use App\Http\Controllers\LocationController;
use App\Http\Controllers\WeatherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is running',
    ]);
});

Route::get('/weather/planner', [WeatherController::class, 'planner']);

Route::get('/location/suggest', [LocationController::class, 'suggest']);
