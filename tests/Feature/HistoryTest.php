<?php

use App\Models\Service;
use App\Models\User;
use App\Models\WorkSession;
use Inertia\Testing\AssertableInertia;

test('historial muestra jornadas finalizadas del usuario', function () {
    $user = User::factory()->create();
    WorkSession::factory()->for($user)->create([
        'status' => 'finished',
        'end_time' => now(),
        'start_time' => now()->subHours(2),
        'initial_cash' => 100,
    ]);

    $this->actingAs($user)
        ->get(route('history'))
        ->assertOk();
});

test('detalle de jornada lista servicios', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create([
        'status' => 'finished',
        'end_time' => now(),
        'start_time' => now()->subHours(2),
        'initial_cash' => 50,
    ]);
    Service::factory()->create([
        'work_session_id' => $session->id,
        'user_id' => $user->id,
        'order_cost' => 10,
        'delivery_cost' => 5,
        'total_cost' => 15,
        'payment_type' => 'cash',
        'notes' => 'Test nota',
    ]);

    $this->actingAs($user)
        ->get(route('history.work-session.show', $session))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('history/show')
            ->has('services', 1)
            ->where('services.0.notes', 'Test nota')
            ->where('services.0.order_cost', 10)
            ->where('services.0.delivery_cost', 5)
            ->where('services.0.total_cost', 15)
            ->where('services.0.payment_label', 'Efectivo')
            ->where('session.initial_cash', 50));
});

test('no puede ver detalle de jornada de otro usuario', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $session = WorkSession::factory()->for($owner)->create([
        'status' => 'finished',
        'end_time' => now(),
    ]);

    $this->actingAs($other)
        ->get(route('history.work-session.show', $session))
        ->assertForbidden();
});

test('puede actualizar estado del reporte de la base en jornada cerrada', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create([
        'status' => 'finished',
        'end_time' => now(),
        'start_time' => now()->subHours(2),
        'initial_cash' => 50,
    ]);

    $this->actingAs($user)
        ->patch(route('work-sessions.base-report.update', $session), [
            'base_report_status' => 'report_received',
        ])
        ->assertRedirect(route('history.work-session.show', $session, absolute: false));

    $this->assertDatabaseHas('work_sessions', [
        'id' => $session->id,
        'base_report_status' => 'report_received',
    ]);

    expect($session->fresh()->base_report_status->value)->toBe('report_received');
});

test('no puede actualizar reporte de jornada de otro usuario', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $session = WorkSession::factory()->for($owner)->create([
        'status' => 'finished',
        'end_time' => now(),
    ]);

    $this->actingAs($other)
        ->patch(route('work-sessions.base-report.update', $session), [
            'base_report_status' => 'reconciled',
        ])
        ->assertForbidden();
});

test('jornada activa no tiene detalle en historial', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);

    $this->actingAs($user)
        ->get(route('history.work-session.show', $session))
        ->assertNotFound();
});
