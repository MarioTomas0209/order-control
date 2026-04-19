<?php

namespace App\Http\Middleware;

use App\Enums\BaseReportStatus;
use App\Enums\UserRole;
use App\Models\WorkSession;
use App\Notifications\PlacePendingSuggestionNotification;
use App\Notifications\PlaceSuggestionRejectedNotification;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            'csrf_token' => csrf_token(),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'success' => $request->session()->get('success'),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
            'pendingBaseReportCount' => $request->user() !== null
                ? WorkSession::query()
                    ->where('user_id', $request->user()->id)
                    ->where('status', 'finished')
                    ->where('base_report_status', '!=', BaseReportStatus::Reconciled->value)
                    ->count()
                : 0,
            'pendingPlaceSuggestionNotificationsCount' => $request->user() !== null && $request->user()->role === UserRole::Admin
                ? $request->user()->unreadNotifications()->where('type', PlacePendingSuggestionNotification::class)->count()
                : 0,
            'unreadPlaceRejectedNotificationsCount' => $request->user() !== null && $request->user()->role === UserRole::Driver
                ? $request->user()->unreadNotifications()->where('type', PlaceSuggestionRejectedNotification::class)->count()
                : 0,
        ]);
    }
}
