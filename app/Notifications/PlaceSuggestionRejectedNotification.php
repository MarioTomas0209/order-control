<?php

namespace App\Notifications;

use App\Models\Place;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PlaceSuggestionRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Place $place,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'place_id' => $this->place->id,
            'place_name' => $this->place->name,
            'category' => $this->place->category,
        ];
    }
}
