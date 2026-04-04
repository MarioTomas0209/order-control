<?php

namespace App\Http\Controllers;

use App\Enums\PaymentType;
use App\Enums\ServiceStatus;
use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use App\Models\WorkSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function create(Request $request): RedirectResponse|Response
    {
        $session = WorkSession::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if ($session === null || $session->isOnBreak()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('services/create');
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $user = $request->user();

        $workSession = WorkSession::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if ($workSession === null || $workSession->isOnBreak()) {
            return redirect()->route('dashboard');
        }

        $lines = $request->validated('order_lines') ?? [];
        $orderCost = $this->orderCostFromRequest((float) $request->validated('order_cost'), $lines);
        $deliveryCost = (float) $request->validated('delivery_cost');
        $totalCost = round($orderCost + $deliveryCost, 2);

        Service::query()->create([
            'work_session_id' => $workSession->id,
            'user_id' => $user->id,
            'order_cost' => $orderCost,
            'delivery_cost' => $deliveryCost,
            'total_cost' => $totalCost,
            'payment_type' => $request->enum('payment_type', PaymentType::class),
            'notes' => $request->validated('notes'),
            'order_lines' => $lines !== [] ? $lines : null,
            'status' => ServiceStatus::Pending,
        ]);

        return redirect()->route('dashboard');
    }

    public function edit(Request $request, Service $service): RedirectResponse|Response
    {
        $redirect = $this->redirectIfNotEditable($request, $service);
        if ($redirect !== null) {
            return $redirect;
        }

        $orderLines = $service->order_lines ?? [];

        return Inertia::render('services/edit', [
            'service' => [
                'id' => $service->id,
                'order_cost' => number_format((float) $service->order_cost, 2, '.', ''),
                'delivery_cost' => number_format((float) $service->delivery_cost, 2, '.', ''),
                'payment_type' => $service->payment_type->value,
                'notes' => $service->notes ?? '',
                'order_lines' => array_map(
                    fn (array $row) => [
                        'label' => (string) ($row['label'] ?? ''),
                        'amount' => isset($row['amount']) ? number_format((float) $row['amount'], 2, '.', '') : '0.00',
                    ],
                    is_array($orderLines) ? $orderLines : [],
                ),
            ],
        ]);
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $redirect = $this->redirectIfNotEditable($request, $service);
        if ($redirect !== null) {
            return $redirect;
        }

        $lines = $request->validated('order_lines') ?? [];
        $orderCost = $this->orderCostFromRequest((float) $request->validated('order_cost'), $lines);
        $deliveryCost = (float) $request->validated('delivery_cost');
        $totalCost = round($orderCost + $deliveryCost, 2);

        $service->update([
            'order_cost' => $orderCost,
            'delivery_cost' => $deliveryCost,
            'total_cost' => $totalCost,
            'payment_type' => $request->enum('payment_type', PaymentType::class),
            'notes' => $request->validated('notes'),
            'order_lines' => $lines !== [] ? $lines : null,
        ]);

        return redirect()->route('dashboard');
    }

    public function cancel(Request $request, Service $service): RedirectResponse
    {
        $redirect = $this->redirectIfNotEditable($request, $service);
        if ($redirect !== null) {
            return $redirect;
        }

        $service->update(['status' => ServiceStatus::Cancelled]);

        return redirect()->route('dashboard');
    }

    private function redirectIfNotEditable(Request $request, Service $service): ?RedirectResponse
    {
        if ($service->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($service->status !== ServiceStatus::Pending) {
            return redirect()->route('dashboard');
        }

        $session = $service->workSession;
        if ($session === null || $session->user_id !== $request->user()->id || $session->status !== 'active') {
            return redirect()->route('dashboard');
        }

        return null;
    }

    /**
     * @param  list<array{label: string, amount: float|int|string}>  $lines
     */
    private function orderCostFromRequest(float $fallbackOrderCost, array $lines): float
    {
        if ($lines === []) {
            return $fallbackOrderCost;
        }

        return round(collect($lines)->sum(fn (array $r) => (float) $r['amount']), 2);
    }
}
