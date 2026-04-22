<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\BadGatewayHttpException;

class NominatimService
{
    private const TIMEOUT_SECONDS = 8;

    private const CACHE_KEY_PREFIX = 'nominatim.suggest.v1';

    /**
     * @return array{suggestions: array<int, array<string, string|null>>}
     */
    public function suggest(string $q): array
    {
        $q = trim($q);
        if (mb_strlen($q) < 2) {
            return ['suggestions' => []];
        }

        $baseUrl = rtrim((string) config('services.nominatim.base_url'), '/');
        if ($baseUrl === '') {
            return ['suggestions' => []];
        }

        $userAgent = (string) config('services.nominatim.user_agent');
        if ($userAgent === '') {
            $userAgent = (string) config('app.name', 'Laravel').' (nominatim; '.(string) config('app.url', 'http://localhost').')';
        }

        $ttl = max(30, (int) config('services.nominatim.cache_ttl_seconds', 60));
        $limit = min(20, max(1, (int) config('services.nominatim.suggest_limit', 8)));
        $cacheKey = self::CACHE_KEY_PREFIX.':'.hash('sha256', mb_strtolower($q, 'UTF-8'));

        /** @var array<int, array<string, string|null>> $suggestions */
        $suggestions = Cache::remember(
            $cacheKey,
            $ttl,
            fn (): array => $this->fetchSuggestions($q, $baseUrl, $userAgent, $limit)
        );

        return ['suggestions' => $suggestions];
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function fetchSuggestions(string $q, string $baseUrl, string $userAgent, int $limit): array
    {
        $url = $baseUrl.'/search';

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders([
                    'User-Agent' => $userAgent,
                    'Accept' => 'application/json',
                    'Accept-Language' => 'en',
                ])
                ->acceptJson()
                ->get($url, [
                    'q' => $q,
                    'format' => 'json',
                    'limit' => $limit,
                    'addressdetails' => 1,
                    'dedupe' => 1,
                ]);
        } catch (\Throwable) {
            throw new BadGatewayHttpException('Location search temporarily unavailable.');
        }

        if (! $response->successful()) {
            throw new BadGatewayHttpException('Location search temporarily unavailable.');
        }

        $body = $response->json();
        if (! is_array($body)) {
            return [];
        }

        $out = [];
        foreach ($body as $row) {
            if (! is_array($row)) {
                continue;
            }
            $mapped = $this->mapItem($row);
            if ($mapped !== null) {
                $out[] = $mapped;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, string|null>|null
     */
    private function mapItem(array $row): ?array
    {
        $placeId = $row['place_id'] ?? null;
        $osmType = isset($row['osm_type']) && is_string($row['osm_type']) ? $row['osm_type'] : '';
        $osmId = $row['osm_id'] ?? null;
        $id = is_int($placeId) || is_float($placeId)
            ? (string) (int) $placeId
            : (is_int($osmId) || is_float($osmId) ? $osmType.'-'.(int) $osmId : '');

        if ($id === '') {
            return null;
        }

        $displayName = isset($row['display_name']) && is_string($row['display_name']) ? $row['display_name'] : null;
        if ($displayName === null || $displayName === '') {
            return null;
        }

        $addr = [];
        if (isset($row['address']) && is_array($row['address'])) {
            $addr = $row['address'];
        }

        $city = null;
        foreach (['city', 'town', 'village', 'municipality', 'suburb', 'county', 'state'] as $k) {
            if (isset($addr[$k]) && is_string($addr[$k]) && trim($addr[$k]) !== '') {
                $city = trim($addr[$k]);
                break;
            }
        }

        $country = isset($addr['country']) && is_string($addr['country']) ? $addr['country'] : null;
        $cc = isset($addr['country_code']) && is_string($addr['country_code']) ? strtoupper($addr['country_code']) : null;

        if ($city === null) {
            $first = explode(',', $displayName, 2)[0] ?? '';
            $city = trim($first);
        }
        if ($city === null || $city === '') {
            return null;
        }

        if ($cc !== null) {
            $searchQuery = $city.','.$cc;
        } else {
            $searchQuery = $displayName;
        }

        return [
            'id' => $id,
            'label' => $displayName,
            'city' => $city,
            'country' => $country,
            'country_code' => $cc,
            'search_query' => $searchQuery,
        ];
    }
}
