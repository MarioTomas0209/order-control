<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkSession>
 */
class WorkSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'start_time' => now(),
            'end_time' => null,
            'initial_cash' => fake()->randomFloat(2, 0, 500),
            'final_cash' => null,
            'status' => 'active',
        ];
    }
}
