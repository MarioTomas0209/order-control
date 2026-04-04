<?php

namespace Database\Factories;

use App\Enums\SessionEventType;
use App\Models\SessionEvent;
use App\Models\User;
use App\Models\WorkSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SessionEvent>
 */
class SessionEventFactory extends Factory
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
            'event_type' => fake()->randomElement(SessionEventType::cases()),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
