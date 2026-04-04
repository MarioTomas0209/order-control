<?php

use App\Enums\PaymentType;
use App\Enums\ServiceStatus;
use App\Models\Service;
use App\Models\User;
use App\Models\WorkSession;

test('puede editar un servicio con jornada activa', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);
    $service = Service::factory()->for($session)->for($user)->create([
        'order_cost' => 10,
        'delivery_cost' => 5,
        'total_cost' => 15,
    ]);

    $this->actingAs($user)
        ->patch(route('services.update', $service), [
            'order_cost' => 20,
            'delivery_cost' => 8,
            'payment_type' => 'transfer',
            'notes' => 'Corregido',
        ])
        ->assertRedirect(route('dashboard'));

    $service->refresh();
    expect((float) $service->order_cost)->toBe(20.0)
        ->and((float) $service->delivery_cost)->toBe(8.0)
        ->and((float) $service->total_cost)->toBe(28.0)
        ->and($service->payment_type)->toBe(PaymentType::Transfer)
        ->and($service->notes)->toBe('Corregido');
});

test('puede anular un servicio con jornada activa', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);
    $service = Service::factory()->for($session)->for($user)->create();

    $this->actingAs($user)
        ->post(route('services.cancel', $service))
        ->assertRedirect(route('dashboard'));

    expect($service->fresh()->status)->toBe(ServiceStatus::Cancelled);
});

test('no puede editar servicio de otra jornada o usuario', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $session = WorkSession::factory()->for($owner)->create(['status' => 'active']);
    $service = Service::factory()->for($session)->for($owner)->create();

    $this->actingAs($other)
        ->patch(route('services.update', $service), [
            'order_cost' => 1,
            'delivery_cost' => 1,
            'payment_type' => 'cash',
        ])
        ->assertForbidden();
});

test('no puede anular servicio ya anulado', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);
    $service = Service::factory()->for($session)->for($user)->create(['status' => ServiceStatus::Cancelled]);

    $this->actingAs($user)
        ->post(route('services.cancel', $service))
        ->assertRedirect(route('dashboard'));

    expect($service->fresh()->status)->toBe(ServiceStatus::Cancelled);
});
