<?php

namespace Database\Factories;

use App\Enums\PlaceStatus;
use App\Models\Place;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Place>
 */
class PlaceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'category' => fake()->randomElement(['Restaurante', 'Farmacia', 'Supermercado', 'Tienda']),
            'phone' => fake()->optional()->numerify('555#######'),
            'whatsapp' => fake()->optional()->numerify('52##########'),
            'address' => fake()->address(),
            'google_maps_link' => 'https://www.google.com/maps/search/?api=1&query='.urlencode(fake()->streetAddress()),
            'latitude' => null,
            'longitude' => null,
            'photo' => null,
            'notes' => fake()->optional()->sentence(),
            'status' => PlaceStatus::Pending,
            'created_by' => User::factory(),
            'approved_by' => null,
            'approved_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PlaceStatus::Approved,
            'approved_by' => User::factory(),
            'approved_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PlaceStatus::Rejected,
            'approved_by' => null,
            'approved_at' => null,
        ]);
    }
}
