<?php

namespace App\Http\Controllers;

use App\Notifications\PlaceSuggestionRejectedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PlaceRejectedNotificationDismissController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $request->user()
            ->unreadNotifications()
            ->where('type', PlaceSuggestionRejectedNotification::class)
            ->get()
            ->each->markAsRead();

        return back();
    }
}
