<?php

namespace App\Http\Requests;

use App\Models\Place;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePlaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Place::class) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'whatsapp' => ['nullable', 'string', 'max:40'],
            'address' => ['required', 'string', 'max:2000'],
            'google_maps_link' => ['required', 'string', 'max:2000', 'url'],
            'latitude' => ['nullable', 'required_with:longitude', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'required_with:latitude', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'category' => 'categoría',
            'phone' => 'teléfono',
            'whatsapp' => 'WhatsApp',
            'address' => 'dirección',
            'google_maps_link' => 'enlace de Google Maps',
            'latitude' => 'latitud',
            'longitude' => 'longitud',
            'notes' => 'notas',
            'photo' => 'foto',
        ];
    }
}
