<?php

use App\Enums\BaseReportStatus;
use App\Enums\SessionEventType;
use App\Models\SessionEvent;
use App\Models\User;
use App\Models\WorkSession;

test('el repartidor puede iniciar jornada', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('work-sessions.store'), [
            'initial_cash' => 125.5,
        ])
        ->assertRedirect(route('dashboard'));

    $session = WorkSession::query()->where('user_id', $user->id)->where('status', 'active')->first();
    expect($session)->not->toBeNull()
        ->and((float) $session->initial_cash)->toBe(125.5);
});

test('finalizar jornada requiere efectivo al cerrar', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);

    $this->actingAs($user)
        ->post(route('work-sessions.end', $session), [])
        ->assertSessionHasErrors('final_cash');
});

test('iniciar jornada requiere dinero disponible', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('work-sessions.store'), [])
        ->assertSessionHasErrors('initial_cash');
});

test('el repartidor puede finalizar jornada activa', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);

    $this->actingAs($user)
        ->post(route('work-sessions.end', $session), [
            'final_cash' => 450.25,
        ])
        ->assertRedirect(route('dashboard'));

    $session->refresh();
    expect($session->status)->toBe('finished')
        ->and($session->end_time)->not->toBeNull()
        ->and((float) $session->final_cash)->toBe(450.25)
        ->and($session->base_report_status)->toBe(BaseReportStatus::Pending);
});

test('no se puede finalizar la jornada de otro usuario', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $session = WorkSession::factory()->for($owner)->create(['status' => 'active']);

    $this->actingAs($other)
        ->post(route('work-sessions.end', $session), [
            'final_cash' => 100,
        ])
        ->assertForbidden();
});

test('puede registrar descanso durante jornada activa', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);

    $this->actingAs($user)
        ->post(route('work-sessions.break', $session))
        ->assertRedirect(route('dashboard'));

    expect(
        SessionEvent::query()
            ->where('work_session_id', $session->id)
            ->where('event_type', SessionEventType::Break)
            ->exists(),
    )->toBeTrue();
});

test('puede reanudar después de descanso', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);
    SessionEvent::factory()->for($session)->for($user)->create(['event_type' => SessionEventType::Break]);

    $this->actingAs($user)
        ->post(route('work-sessions.resume', $session))
        ->assertRedirect(route('dashboard'));

    expect(
        SessionEvent::query()
            ->where('work_session_id', $session->id)
            ->where('event_type', SessionEventType::Resume)
            ->exists(),
    )->toBeTrue();
});

test('no se crea un segundo descanso sin reanudar', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);
    SessionEvent::factory()->for($session)->for($user)->create(['event_type' => SessionEventType::Break]);

    $countBefore = SessionEvent::query()->where('work_session_id', $session->id)->count();

    $this->actingAs($user)
        ->post(route('work-sessions.break', $session))
        ->assertRedirect(route('dashboard'));

    expect(SessionEvent::query()->where('work_session_id', $session->id)->count())->toBe($countBefore);
});
