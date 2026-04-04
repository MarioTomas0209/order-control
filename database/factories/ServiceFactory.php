<?php

namespace Database\Factories;

use App\Enums\PaymentType;
use App\Models\Service;
use App\Models\User;
use App\Models\WorkSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory();

        return [
            'user_id' => $user,
            'work_session_id' => WorkSession::factory()->for($user),
            'order_cost' => fake()->randomFloat(2, 5, 200),
            'delivery_cost' => fake()->randomFloat(2, 1, 50),
            'total_cost' => fake()->randomFloat(2, 10, 250),
            'payment_type' => fake()->randomElement(PaymentType::cases())->value,
            'reported_amount' => fake()->optional()->randomFloat(2, 10, 250),
            'status' => 'pending',
            'notes' => fake()->optional()->sentence(),
            'order_lines' => null,
        ];
    }
}
