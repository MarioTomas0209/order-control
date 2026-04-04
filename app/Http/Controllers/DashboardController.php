<?php

namespace App\Http\Controllers;

use App\Enums\ServiceStatus;
use App\Models\Service;
use App\Models\WorkSession;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $displayTz = config('app.display_timezone');

        $activeSession = WorkSession::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->withCount(['services as services_count' => fn ($q) => $q->where('status', ServiceStatus::Pending)])
            ->first();

        $servicesCount = 0;
        $totalDeliveries = 0.0;
        $sessionServices = [];

        if ($activeSession) {
            $servicesCount = (int) $activeSession->services_count;
            $totalDeliveries = (float) $activeSession->services()->where('status', ServiceStatus::Pending)->sum('delivery_cost');

            $sessionServices = $activeSession->services()
                ->where('status', ServiceStatus::Pending)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (Service $s) => [
                    'id' => $s->id,
                    'order_cost' => (float) $s->order_cost,
                    'delivery_cost' => (float) $s->delivery_cost,
                    'total_cost' => (float) $s->total_cost,
                    'payment_label' => $s->payment_type->label(),
                    'time_label' => $s->created_at->copy()->timezone($displayTz)->format('g:i a'),
                    'notes' => $s->notes,
                    'order_lines' => $s->order_lines ?? [],
                ])
                ->values()
                ->all();
        }

        $lastService = Service::query()
            ->where('user_id', $user->id)
            ->where('status', ServiceStatus::Pending)
            ->latest()
            ->first();

        $onBreak = $activeSession !== null && $activeSession->isOnBreak();

        return Inertia::render('dashboard', [
            'activeWorkSession' => $activeSession ? [
                'id' => $activeSession->id,
                'start_time' => $activeSession->start_time->toIso8601String(),
                'start_label' => 'Jornada activa desde '.$this->formatTimeSpanish12h(
                    $activeSession->start_time->copy()->timezone($displayTz),
                ),
                'initial_cash' => (float) $activeSession->initial_cash,
                'on_break' => $onBreak,
            ] : null,
            'stats' => [
                'services_count' => $servicesCount,
                'total_deliveries' => $totalDeliveries,
            ],
            'sessionServices' => $sessionServices,
            'lastService' => $lastService ? [
                'at' => $lastService->created_at->toIso8601String(),
                'label' => $lastService->created_at->diffForHumans(),
                'payment_label' => $lastService->payment_type->label(),
            ] : null,
        ]);
    }

    private function formatTimeSpanish12h(Carbon $dateTime): string
    {
        $hour24 = (int) $dateTime->format('H');
        $minute = $dateTime->format('i');
        $hour12 = (int) $dateTime->format('g');
        $suffix = $hour24 < 12 ? 'a. m.' : 'p. m.';

        return sprintf('%d:%s %s', $hour12, $minute, $suffix);
    }
}
