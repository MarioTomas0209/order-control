<?php

namespace App\Http\Controllers;

use App\Enums\BaseReportStatus;
use App\Enums\SessionEventType;
use App\Http\Requests\EndWorkSessionRequest;
use App\Http\Requests\StoreWorkSessionRequest;
use App\Http\Requests\UpdateWorkSessionBaseReportRequest;
use App\Models\SessionEvent;
use App\Models\WorkSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkSessionController extends Controller
{
    public function store(StoreWorkSessionRequest $request): RedirectResponse
    {
        $user = $request->user();

        $hasActive = WorkSession::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();

        if ($hasActive) {
            return redirect()->route('dashboard');
        }

        $initialCash = $request->validated('initial_cash');

        DB::transaction(function () use ($user, $initialCash): void {
            $session = WorkSession::query()->create([
                'user_id' => $user->id,
                'start_time' => now(),
                'initial_cash' => $initialCash,
                'status' => 'active',
            ]);

            SessionEvent::query()->create([
                'work_session_id' => $session->id,
                'user_id' => $user->id,
                'event_type' => SessionEventType::Start,
            ]);
        });

        return redirect()->route('dashboard');
    }

    public function takeBreak(Request $request, WorkSession $workSession): RedirectResponse
    {
        if ($workSession->user_id !== $request->user()->id || $workSession->status !== 'active') {
            abort(403);
        }

        $last = $workSession->sessionEvents()->latest('id')->first();
        if ($last !== null && $last->event_type === SessionEventType::Break) {
            return redirect()->route('dashboard');
        }

        SessionEvent::query()->create([
            'work_session_id' => $workSession->id,
            'user_id' => $request->user()->id,
            'event_type' => SessionEventType::Break,
        ]);

        return redirect()->route('dashboard');
    }

    public function resume(Request $request, WorkSession $workSession): RedirectResponse
    {
        if ($workSession->user_id !== $request->user()->id || $workSession->status !== 'active') {
            abort(403);
        }

        $last = $workSession->sessionEvents()->latest('id')->first();
        if ($last === null || $last->event_type !== SessionEventType::Break) {
            return redirect()->route('dashboard');
        }

        SessionEvent::query()->create([
            'work_session_id' => $workSession->id,
            'user_id' => $request->user()->id,
            'event_type' => SessionEventType::Resume,
        ]);

        return redirect()->route('dashboard');
    }

    public function end(EndWorkSessionRequest $request, WorkSession $workSession): RedirectResponse
    {
        if ($workSession->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($workSession->status !== 'active') {
            return redirect()->route('dashboard');
        }

        $finalCash = (float) $request->validated('final_cash');

        DB::transaction(function () use ($request, $workSession, $finalCash): void {
            $workSession->update([
                'end_time' => now(),
                'final_cash' => $finalCash,
                'status' => 'finished',
                'base_report_status' => BaseReportStatus::Pending,
            ]);

            SessionEvent::query()->create([
                'work_session_id' => $workSession->id,
                'user_id' => $request->user()->id,
                'event_type' => SessionEventType::Finish,
            ]);
        });

        return redirect()->route('dashboard');
    }

    public function updateBaseReport(UpdateWorkSessionBaseReportRequest $request, WorkSession $workSession): RedirectResponse
    {
        if ($workSession->user_id !== $request->user()->id || $workSession->status !== 'finished') {
            abort(403);
        }

        $workSession->update([
            'base_report_status' => BaseReportStatus::from($request->validated('base_report_status')),
        ]);

        return redirect()->route('history.work-session.show', $workSession);
    }
}
