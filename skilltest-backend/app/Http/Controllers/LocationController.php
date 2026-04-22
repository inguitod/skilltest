<?php

namespace App\Http\Controllers;

use App\Http\Requests\LocationSuggestRequest;
use App\Services\NominatimService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\BadGatewayHttpException;

class LocationController extends Controller
{
    public function __construct(
        private readonly NominatimService $nominatim,
    ) {}

    public function suggest(LocationSuggestRequest $request): JsonResponse
    {
        $q = (string) $request->validated('q');

        try {
            return response()->json($this->nominatim->suggest($q));
        } catch (BadGatewayHttpException) {
            return response()->json(['suggestions' => []]);
        }
    }
}
