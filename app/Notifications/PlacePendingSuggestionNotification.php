<?php

namespace App\Notifications;

use App\Models\Place;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Notification;

class PlacePendingSuggestionNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Place $place,
        public User $submitter,
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
            'submitter_name' => $this->submitter->name,
        ];
    }

    /**
     * Elimina notificaciones de este tipo asociadas al local (p. ej. tras aprobar o rechazar).
     */
    public static function dismissForPlace(Place $place): void
    {
        DatabaseNotification::query()
            ->where('type', self::class)
            ->get()
            ->filter(fn (DatabaseNotification $notification) => (int) ($notification->data['place_id'] ?? 0) === $place->id)
            ->each(fn (DatabaseNotification $notification) => $notification->delete());
    }
}
