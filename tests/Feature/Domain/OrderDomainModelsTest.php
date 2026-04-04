<?php

use App\Enums\SessionEventType;
use App\Enums\UserRole;
use App\Models\Service;
use App\Models\SessionEvent;
use App\Models\User;
use App\Models\WorkSession;

test('user tiene rol como enum y relaciones con jornadas', function () {
    $user = User::factory()->create(['role' => UserRole::Admin]);

    expect($user->role)->toBe(UserRole::Admin);

    $session = WorkSession::factory()->for($user)->create();

    expect($user->workSessions)->toHaveCount(1)
        ->and($user->workSessions->first()->id)->toBe($session->id);
});

test('jornada agrupa servicios y eventos de sesión', function () {
    $user = User::factory()->create();
    $workSession = WorkSession::factory()->for($user)->create();

    $service = Service::factory()->for($workSession)->for($user)->create();
    $event = SessionEvent::factory()->for($workSession)->for($user)->create([
        'event_type' => SessionEventType::Break,
    ]);

    $workSession->load('services', 'sessionEvents');

    expect($workSession->services)->toHaveCount(1)
        ->and($workSession->sessionEvents)->toHaveCount(1)
        ->and($service->workSession->is($workSession))->toBeTrue()
        ->and($event->event_type)->toBe(SessionEventType::Break);
});

test('session event solo persiste created_at', function () {
    $event = SessionEvent::factory()->create();

    expect($event->created_at)->not->toBeNull()
        ->and($event->updated_at ?? null)->toBeNull();
});
