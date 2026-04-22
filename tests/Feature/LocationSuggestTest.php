<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LocationSuggestTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config([
            'services.nominatim.base_url' => 'https://nominatim.openstreetmap.org',
            'services.nominatim.user_agent' => 'AuraWeather Test/1.0',
            'services.nominatim.cache_ttl_seconds' => 60,
            'services.nominatim.suggest_limit' => 8,
        ]);
    }

    public function test_suggest_returns_mapped_places(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/search*' => Http::response([
                [
                    'place_id' => 282_134_968,
                    'osm_type' => 'relation',
                    'osm_id' => 175_342,
                    'lat' => '51.48933',
                    'lon' => '-0.14405',
                    'display_name' => 'London, England, United Kingdom',
                    'address' => [
                        'city' => 'London',
                        'state' => 'England',
                        'country' => 'United Kingdom',
                        'country_code' => 'gb',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/location/suggest?q=London');

        $response->assertStatus(200)
            ->assertJsonPath('suggestions.0.city', 'London')
            ->assertJsonPath('suggestions.0.country', 'United Kingdom')
            ->assertJsonPath('suggestions.0.country_code', 'GB')
            ->assertJsonPath('suggestions.0.search_query', 'London,GB');

        Http::assertSent(function ($request): bool {
            return str_contains($request->url(), 'nominatim.openstreetmap.org/search')
                && $request['q'] === 'London';
        });
    }

    public function test_short_query_returns_empty_without_upstream(): void
    {
        Http::fake();

        $response = $this->getJson('/api/location/suggest?q=a');

        $response->assertStatus(200)->assertJson(['suggestions' => []]);
        Http::assertNothingSent();
    }

    public function test_suggest_validates_q_required(): void
    {
        $response = $this->getJson('/api/location/suggest');

        $response->assertStatus(422);
        Http::assertNothingSent();
    }
}
