<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WeatherPlannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('city') && is_string($this->input('city'))) {
            $this->merge([
                'city' => trim($this->input('city')),
            ]);
        }

        if ($this->has('force_refresh')) {
            $this->merge([
                'force_refresh' => $this->boolean('force_refresh'),
            ]);
        }
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'city' => ['required', 'string', 'max:255'],
            'force_refresh' => ['sometimes', 'boolean'],
        ];
    }
}
