<?php

use App\Http\Controllers\Api\PlaceController as ApiPlaceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\PlaceRejectedNotificationDismissController;
use App\Http\Controllers\PlaceViewController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkSessionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

/** Manifiesto PWA (Chrome: «Instalar aplicación»). */
Route::get('/manifest.webmanifest', function () {
    $name = config('app.name', 'Laravel');

    return response()->json([
        'name' => $name,
        'short_name' => Str::limit($name, 12, ''),
        'description' => 'Control de pedidos y repartos',
        'start_url' => '/',
        'scope' => '/',
        'display' => 'standalone',
        'orientation' => 'portrait-primary',
        'background_color' => '#ffffff',
        'theme_color' => '#0ea5e9',
        'icons' => [
            [
                'src' => '/pwa-192.png',
                'sizes' => '192x192',
                'type' => 'image/png',
                'purpose' => 'any',
            ],
            [
                'src' => '/pwa-512.png',
                'sizes' => '512x512',
                'type' => 'image/png',
                'purpose' => 'any',
            ],
            [
                'src' => '/pwa-512.png',
                'sizes' => '512x512',
                'type' => 'image/png',
                'purpose' => 'maskable',
            ],
        ],
    ], 200, ['Content-Type' => 'application/manifest+json'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
})->name('pwa.manifest');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('history', [HistoryController::class, 'index'])->name('history');
    Route::get('history/work-sessions/{workSession}', [HistoryController::class, 'show'])->name('history.work-session.show');

    Route::post('work-sessions', [WorkSessionController::class, 'store'])->name('work-sessions.store');
    Route::post('work-sessions/{workSession}/break', [WorkSessionController::class, 'takeBreak'])->name('work-sessions.break');
    Route::post('work-sessions/{workSession}/resume', [WorkSessionController::class, 'resume'])->name('work-sessions.resume');
    Route::post('work-sessions/{workSession}/end', [WorkSessionController::class, 'end'])->name('work-sessions.end');
    Route::patch('history/work-sessions/{workSession}/base-report', [WorkSessionController::class, 'updateBaseReport'])->name('work-sessions.base-report.update');

    Route::get('services/create', [ServiceController::class, 'create'])->name('services.create');
    Route::post('services', [ServiceController::class, 'store'])->name('services.store');
    Route::get('services/{service}/edit', [ServiceController::class, 'edit'])->name('services.edit');
    Route::patch('services/{service}', [ServiceController::class, 'update'])->name('services.update');
    Route::post('services/{service}/cancel', [ServiceController::class, 'cancel'])->name('services.cancel');

    Route::resource('users', UserController::class)->except(['show']);

    Route::get('places', [PlaceViewController::class, 'index'])->name('places.index');
    Route::get('places/create', [PlaceViewController::class, 'create'])->name('places.create');
    Route::get('places/{place}/edit', [PlaceViewController::class, 'edit'])->name('places.edit');

    Route::post('notifications/place-rejected/dismiss', PlaceRejectedNotificationDismissController::class)->name('notifications.place-rejected.dismiss');

    Route::prefix('api')->name('api.')->group(function () {
        Route::get('places/search', [ApiPlaceController::class, 'search'])->name('places.search');
        Route::get('places/pending', [ApiPlaceController::class, 'pending'])->name('places.pending');
        Route::get('places/categories', [ApiPlaceController::class, 'categories'])->name('places.categories');
        Route::get('places', [ApiPlaceController::class, 'index'])->name('places.index');
        Route::post('places', [ApiPlaceController::class, 'store'])->name('places.store');
        Route::patch('places/{place}', [ApiPlaceController::class, 'update'])->name('places.update');
        Route::post('places/{place}/approve', [ApiPlaceController::class, 'approve'])->name('places.approve');
        Route::post('places/{place}/reject', [ApiPlaceController::class, 'reject'])->name('places.reject');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
