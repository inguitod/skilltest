<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WeatherPlannerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config([
            'services.openweather.key' => 'test-openweather-key',
            'services.openweather.base_url' => 'https://api.openweathermap.org/data/2.5',
            'services.openweather.cache_ttl_seconds' => 600,
        ]);
    }

    public function test_planner_returns_current_air_and_forecast(): void
    {
        Http::fake([
            'api.openweathermap.org/data/2.5/weather*' => Http::response([
                'cod' => 200,
                'coord' => ['lat' => 51.5085, 'lon' => -0.1257],
                'weather' => [['main' => 'Clouds', 'description' => 'broken clouds', 'icon' => '04d']],
                'main' => [
                    'temp' => 12.3,
                    'feels_like' => 11.0,
                    'temp_min' => 10.0,
                    'temp_max' => 14.0,
                    'pressure' => 1012,
                    'humidity' => 72,
                ],
                'visibility' => 8000,
                'wind' => ['speed' => 4.2, 'deg' => 180, 'gust' => 6.1],
                'clouds' => ['all' => 75],
                'dt' => 1_700_000_000,
                'sys' => ['country' => 'GB', 'sunrise' => 1_700_000_000, 'sunset' => 1_700_040_000],
                'timezone' => 0,
                'name' => 'London',
            ], 200),
            'api.openweathermap.org/data/2.5/air_pollution*' => Http::response([
                'list' => [[
                    'main' => ['aqi' => 2],
                    'components' => [
                        'co' => 210.5,
                        'no' => 0.1,
                        'no2' => 18.2,
                        'o3' => 55.0,
                        'so2' => 1.2,
                        'pm2_5' => 4.5,
                        'pm10' => 9.0,
                        'nh3' => 0.3,
                    ],
                    'dt' => 1_700_000_000,
                ]],
            ], 200),
            'api.openweathermap.org/data/2.5/forecast*' => Http::response([
                'list' => [
                    [
                        'dt' => 1_700_003_600,
                        'main' => ['temp' => 11.1, 'feels_like' => 10.0, 'humidity' => 70, 'pressure' => 1011],
                        'weather' => [['main' => 'Rain', 'description' => 'light rain']],
                        'clouds' => ['all' => 90],
                        'wind' => ['speed' => 5.0, 'deg' => 200],
                        'visibility' => 5000,
                        'pop' => 0.4,
                        'dt_txt' => '2024-01-01 12:00:00',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/weather/planner?city=London');

        $response->assertStatus(200)
            ->assertJsonPath('city', 'London')
            ->assertJsonPath('country', 'GB')
            ->assertJsonPath('current.temperature_c', 12.3)
            ->assertJsonPath('current.humidity_percent', 72)
            ->assertJsonPath('current.visibility_m', 8000)
            ->assertJsonPath('current.weather.condition', 'Clouds')
            ->assertJsonPath('air_quality.aqi', 2)
            ->assertJsonPath('air_quality.aqi_label', 'Fair')
            ->assertJsonPath('forecast.0.temperature_c', 11.1);

        Http::assertSentCount(3);
    }

    public function test_planner_returns_404_when_city_unknown(): void
    {
        Http::fake([
            'api.openweathermap.org/data/2.5/weather*' => Http::response([
                'cod' => '404',
                'message' => 'city not found',
            ], 200),
        ]);

        $response = $this->getJson('/api/weather/planner?city=Nosuchcityzz');

        $response->assertStatus(404);
        Http::assertSentCount(1);
    }

    public function test_planner_validates_city_required(): void
    {
        $response = $this->getJson('/api/weather/planner');

        $response->assertStatus(422);
        Http::assertNothingSent();
    }
}
