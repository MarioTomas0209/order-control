<?php

namespace App\Http\Controllers;

use App\Enums\BaseReportStatus;
use App\Enums\ServiceStatus;
use App\Models\Service;
use App\Models\WorkSession;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tz = config('app.display_timezone');

        $pendingFilter = fn ($q) => $q->where('status', ServiceStatus::Pending);

        $paginator = WorkSession::query()
            ->where('user_id', $user->id)
            ->where('status', 'finished')
            ->withCount(['services as services_count' => $pendingFilter])
            ->withSum(['services as services_sum_delivery_cost' => $pendingFilter], 'delivery_cost')
            ->withSum(['services as services_sum_order_cost' => $pendingFilter], 'order_cost')
            ->withSum(['services as services_sum_total_cost' => $pendingFilter], 'total_cost')
            ->orderByDesc('end_time')
            ->orderByDesc('id')
            ->paginate(15);

        $paginator->setCollection(
            $paginator->getCollection()->map(function (WorkSession $s) use ($tz) {
                $status = $s->base_report_status instanceof BaseReportStatus
                    ? $s->base_report_status
                    : BaseReportStatus::Pending;

                return [
                    'id' => $s->id,
                    'period_label' => $this->formatPeriod($s->start_time, $s->end_time, $tz),
                    'initial_cash' => (float) $s->initial_cash,
                    'final_cash' => $s->final_cash !== null ? (float) $s->final_cash : null,
                    'services_count' => $s->services_count,
                    'sum_delivery' => (float) ($s->services_sum_delivery_cost ?? 0),
                    'sum_order' => (float) ($s->services_sum_order_cost ?? 0),
                    'sum_total' => (float) ($s->services_sum_total_cost ?? 0),
                    'base_report_status' => $status->value,
                    'base_report_label' => $status->label(),
                    'needs_base_attention' => $status !== BaseReportStatus::Reconciled,
                ];
            }),
        );

        return Inertia::render('history/index', [
            'sessions' => $paginator,
        ]);
    }

    public function show(Request $request, WorkSession $workSession): Response
    {
        if ($workSession->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($workSession->status !== 'finished') {
            abort(404);
        }

        $tz = config('app.display_timezone');

        $workSession->load(['services' => fn ($q) => $q->orderBy('created_at')]);

        $pendingServices = $workSession->services->filter(
            fn (Service $svc) => $svc->status === ServiceStatus::Pending,
        );

        $reportStatus = $workSession->base_report_status instanceof BaseReportStatus
            ? $workSession->base_report_status
            : BaseReportStatus::Pending;

        return Inertia::render('history/show', [
            'session' => [
                'id' => $workSession->id,
                'period_label' => $this->formatPeriod($workSession->start_time, $workSession->end_time, $tz),
                'initial_cash' => (float) $workSession->initial_cash,
                'final_cash' => $workSession->final_cash !== null ? (float) $workSession->final_cash : null,
                'services_count' => $pendingServices->count(),
                'sum_delivery' => (float) $pendingServices->sum('delivery_cost'),
                'sum_order' => (float) $pendingServices->sum('order_cost'),
                'sum_total' => (float) $pendingServices->sum('total_cost'),
                'base_report_status' => $reportStatus->value,
                'base_report_label' => $reportStatus->label(),
                'base_report_options' => collect(BaseReportStatus::cases())->map(fn (BaseReportStatus $c) => [
                    'value' => $c->value,
                    'label' => $c->label(),
                ])->values()->all(),
            ],
            'services' => $workSession->services->map(fn (Service $svc) => [
                'id' => $svc->id,
                'order_cost' => (float) $svc->order_cost,
                'delivery_cost' => (float) $svc->delivery_cost,
                'total_cost' => (float) $svc->total_cost,
                'payment_type' => $svc->payment_type->value,
                'payment_label' => $svc->payment_type->label(),
                'notes' => $svc->notes,
                'time_label' => $svc->created_at->copy()->timezone($tz)->format('d/m/Y g:i a'),
                'is_cancelled' => $svc->status === ServiceStatus::Cancelled,
                'order_lines' => $svc->order_lines ?? [],
            ]),
        ]);
    }

    private function formatPeriod(?Carbon $start, ?Carbon $end, string $tz): string
    {
        if ($start === null) {
            return '—';
        }

        $startLabel = $start->copy()->timezone($tz)->format('d/m/Y g:i a');
        $endLabel = $end !== null ? $end->copy()->timezone($tz)->format('d/m/Y g:i a') : '—';

        return $startLabel.' – '.$endLabel;
    }
}
