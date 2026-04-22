<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\BadGatewayHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class WeatherService
{
    private const TIMEOUT_SECONDS = 10;

    private string $baseUrl;

    private ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('services.openweather.base_url'), '/');
        $key = config('services.openweather.key');
        $this->apiKey = is_string($key) && $key !== '' ? $key : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function getPlannerByCity(string $city): array
    {
        if ($this->apiKey === null) {
            throw new ServiceUnavailableHttpException(null, 'Weather service is not configured.');
        }

        $city = trim($city);
        $query = [
            'q' => $city,
            'appid' => $this->apiKey,
            'units' => 'metric',
        ];

        $weatherResponse = Http::timeout(self::TIMEOUT_SECONDS)
            ->acceptJson()
            ->get("{$this->baseUrl}/weather", $query);

        if ($weatherResponse->failed()) {
            if ($weatherResponse->status() === 404) {
                throw new NotFoundHttpException('City not found.');
            }
            if ($weatherResponse->status() === 401) {
                throw new BadGatewayHttpException('Weather API configuration error.');
            }
            throw new BadGatewayHttpException('Weather service temporarily unavailable.');
        }

        /** @var array<string, mixed> $weather */
        $weather = $weatherResponse->json() ?? [];
        if (isset($weather['cod']) && (string) $weather['cod'] === '404') {
            throw new NotFoundHttpException('City not found.');
        }
        if (isset($weather['cod']) && (string) $weather['cod'] !== '200') {
            throw new BadGatewayHttpException((string) ($weather['message'] ?? 'Weather service returned an error.'));
        }

        $lat = $weather['coord']['lat'] ?? null;
        $lon = $weather['coord']['lon'] ?? null;
        if (! is_numeric($lat) || ! is_numeric($lon)) {
            throw new BadGatewayHttpException('Weather response missing coordinates.');
        }

        $airResponse = Http::timeout(self::TIMEOUT_SECONDS)
            ->acceptJson()
            ->get("{$this->baseUrl}/air_pollution", [
                'lat' => $lat,
                'lon' => $lon,
                'appid' => $this->apiKey,
            ]);

        if (! $airResponse->successful()) {
            throw new BadGatewayHttpException('Air quality data temporarily unavailable.');
        }

        /** @var array<string, mixed> $air */
        $air = $airResponse->json() ?? [];
        /** @var array<string, mixed>|null $airEntry */
        $airEntry = isset($air['list'][0]) && is_array($air['list'][0]) ? $air['list'][0] : null;

        $forecastResponse = Http::timeout(self::TIMEOUT_SECONDS)
            ->acceptJson()
            ->get("{$this->baseUrl}/forecast", $query);

        $forecastItems = [];
        if ($forecastResponse->successful()) {
            /** @var array<string, mixed> $forecast */
            $forecast = $forecastResponse->json() ?? [];
            $list = $forecast['list'] ?? [];
            if (is_array($list)) {
                $mapped = array_map(fn (mixed $item): array => $this->mapForecastItem(is_array($item) ? $item : []), $list);
                $forecastItems = array_slice($mapped, 0, 8);
            }
        }

        return [
            'city' => isset($weather['name']) && is_string($weather['name']) ? $weather['name'] : $city,
            'country' => isset($weather['sys']['country']) && is_string($weather['sys']['country'])
                ? $weather['sys']['country']
                : null,
            'coordinates' => [
                'latitude' => (float) $lat,
                'longitude' => (float) $lon,
            ],
            'current' => $this->mapCurrent($weather),
            'air_quality' => $this->mapAirQuality($airEntry),
            'forecast' => $forecastItems,
        ];
    }

    /**
     * @param  array<string, mixed>  $weather
     * @return array<string, mixed>
     */
    private function mapCurrent(array $weather): array
    {
        $w = isset($weather['weather'][0]) && is_array($weather['weather'][0])
            ? $weather['weather'][0]
            : [];
        $icon = isset($w['icon']) && is_string($w['icon']) ? $w['icon'] : null;

        return [
            'temperature_c' => isset($weather['main']['temp']) && is_numeric($weather['main']['temp'])
                ? (float) $weather['main']['temp']
                : null,
            'feels_like_c' => isset($weather['main']['feels_like']) && is_numeric($weather['main']['feels_like'])
                ? (float) $weather['main']['feels_like']
                : null,
            'temp_min_c' => isset($weather['main']['temp_min']) && is_numeric($weather['main']['temp_min'])
                ? (float) $weather['main']['temp_min']
                : null,
            'temp_max_c' => isset($weather['main']['temp_max']) && is_numeric($weather['main']['temp_max'])
                ? (float) $weather['main']['temp_max']
                : null,
            'humidity_percent' => isset($weather['main']['humidity']) && is_numeric($weather['main']['humidity'])
                ? (int) $weather['main']['humidity']
                : null,
            'pressure_hpa' => isset($weather['main']['pressure']) && is_numeric($weather['main']['pressure'])
                ? (int) $weather['main']['pressure']
                : null,
            'visibility_m' => isset($weather['visibility']) && is_numeric($weather['visibility'])
                ? (int) $weather['visibility']
                : null,
            'clouds_percent' => isset($weather['clouds']['all']) && is_numeric($weather['clouds']['all'])
                ? (int) $weather['clouds']['all']
                : null,
            'wind' => [
                'speed_ms' => isset($weather['wind']['speed']) && is_numeric($weather['wind']['speed'])
                    ? (float) $weather['wind']['speed']
                    : null,
                'direction_deg' => isset($weather['wind']['deg']) && is_numeric($weather['wind']['deg'])
                    ? (int) $weather['wind']['deg']
                    : null,
                'gust_ms' => isset($weather['wind']['gust']) && is_numeric($weather['wind']['gust'])
                    ? (float) $weather['wind']['gust']
                    : null,
            ],
            'weather' => [
                'condition' => isset($w['main']) && is_string($w['main']) ? $w['main'] : null,
                'description' => isset($w['description']) && is_string($w['description']) ? $w['description'] : null,
                'icon' => $icon,
                'icon_url' => $icon !== null ? "https://openweathermap.org/img/wn/{$icon}@2x.png" : null,
            ],
            'sunrise' => isset($weather['sys']['sunrise']) && is_numeric($weather['sys']['sunrise'])
                ? (int) $weather['sys']['sunrise']
                : null,
            'sunset' => isset($weather['sys']['sunset']) && is_numeric($weather['sys']['sunset'])
                ? (int) $weather['sys']['sunset']
                : null,
            'timezone_offset_seconds' => isset($weather['timezone']) && is_numeric($weather['timezone'])
                ? (int) $weather['timezone']
                : null,
            'measured_at_unix' => isset($weather['dt']) && is_numeric($weather['dt'])
                ? (int) $weather['dt']
                : null,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $entry
     * @return array<string, mixed>
     */
    private function mapAirQuality(?array $entry): array
    {
        if ($entry === null) {
            return [
                'aqi' => null,
                'aqi_label' => null,
                'components' => null,
            ];
        }

        $aqi = isset($entry['main']['aqi']) && is_numeric($entry['main']['aqi'])
            ? (int) $entry['main']['aqi']
            : null;
        $labels = [
            1 => 'Good',
            2 => 'Fair',
            3 => 'Moderate',
            4 => 'Poor',
            5 => 'Very poor',
        ];

        $components = $entry['components'] ?? null;
        if (is_array($components)) {
            $out = [];
            foreach ($components as $k => $v) {
                if (is_string($k) && is_numeric($v)) {
                    $out[$k] = (float) $v;
                }
            }
            $components = $out;
        } else {
            $components = null;
        }

        return [
            'aqi' => $aqi,
            'aqi_label' => $aqi !== null ? ($labels[$aqi] ?? null) : null,
            'components' => $components,
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function mapForecastItem(array $item): array
    {
        $w = isset($item['weather'][0]) && is_array($item['weather'][0])
            ? $item['weather'][0]
            : [];

        return [
            'at_unix' => isset($item['dt']) && is_numeric($item['dt']) ? (int) $item['dt'] : null,
            'at_text' => isset($item['dt_txt']) && is_string($item['dt_txt']) ? $item['dt_txt'] : null,
            'temperature_c' => isset($item['main']['temp']) && is_numeric($item['main']['temp'])
                ? (float) $item['main']['temp']
                : null,
            'feels_like_c' => isset($item['main']['feels_like']) && is_numeric($item['main']['feels_like'])
                ? (float) $item['main']['feels_like']
                : null,
            'humidity_percent' => isset($item['main']['humidity']) && is_numeric($item['main']['humidity'])
                ? (int) $item['main']['humidity']
                : null,
            'pressure_hpa' => isset($item['main']['pressure']) && is_numeric($item['main']['pressure'])
                ? (int) $item['main']['pressure']
                : null,
            'precipitation_probability' => isset($item['pop']) && is_numeric($item['pop'])
                ? round((float) $item['pop'] * 100, 1)
                : null,
            'wind_speed_ms' => isset($item['wind']['speed']) && is_numeric($item['wind']['speed'])
                ? (float) $item['wind']['speed']
                : null,
            'wind_direction_deg' => isset($item['wind']['deg']) && is_numeric($item['wind']['deg'])
                ? (int) $item['wind']['deg']
                : null,
            'visibility_m' => isset($item['visibility']) && is_numeric($item['visibility'])
                ? (int) $item['visibility']
                : null,
            'clouds_percent' => isset($item['clouds']['all']) && is_numeric($item['clouds']['all'])
                ? (int) $item['clouds']['all']
                : null,
            'weather' => [
                'condition' => isset($w['main']) && is_string($w['main']) ? $w['main'] : null,
                'description' => isset($w['description']) && is_string($w['description']) ? $w['description'] : null,
            ],
        ];
    }
}
