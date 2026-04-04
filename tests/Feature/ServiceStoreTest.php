<?php

use App\Enums\PaymentType;
use App\Enums\ServiceStatus;
use App\Enums\SessionEventType;
use App\Models\Service;
use App\Models\SessionEvent;
use App\Models\User;
use App\Models\WorkSession;

test('puede registrar un servicio con jornada activa', function () {
    $user = User::factory()->create();
    WorkSession::factory()->for($user)->create(['status' => 'active']);

    $this->actingAs($user)
        ->post(route('services.store'), [
            'order_cost' => 100,
            'delivery_cost' => 25.5,
            'notes' => 'Entregar en portería',
        ])
        ->assertRedirect(route('dashboard'));

    $service = Service::query()->first();
    expect($service)->not->toBeNull()
        ->and((float) $service->order_cost)->toBe(100.0)
        ->and((float) $service->delivery_cost)->toBe(25.5)
        ->and((float) $service->total_cost)->toBe(125.5)
        ->and($service->payment_type)->toBe(PaymentType::Cash)
        ->and($service->notes)->toBe('Entregar en portería')
        ->and($service->status)->toBe(ServiceStatus::Pending);
});

test('puede registrar servicio con lista de productos y suma el pedido', function () {
    $user = User::factory()->create();
    WorkSession::factory()->for($user)->create(['status' => 'active']);

    $this->actingAs($user)
        ->post(route('services.store'), [
            'order_cost' => 999,
            'delivery_cost' => 10,
            'order_lines' => [
                ['label' => 'Tortillas', 'amount' => 25.5],
                ['label' => 'Refresco', 'amount' => 15],
            ],
        ])
        ->assertRedirect(route('dashboard'));

    $service = Service::query()->first();
    expect($service)->not->toBeNull()
        ->and((float) $service->order_cost)->toBe(40.5)
        ->and($service->order_lines)->toHaveCount(2)
        ->and((float) $service->order_lines[0]['amount'])->toBe(25.5)
        ->and((float) $service->order_lines[1]['amount'])->toBe(15.0)
        ->and($service->order_lines[0]['label'])->toBe('Tortillas')
        ->and($service->order_lines[1]['label'])->toBe('Refresco');
});

test('puede registrar servicio con pago por transferencia', function () {
    $user = User::factory()->create();
    WorkSession::factory()->for($user)->create(['status' => 'active']);

    $this->actingAs($user)
        ->post(route('services.store'), [
            'order_cost' => 50,
            'delivery_cost' => 10,
            'payment_type' => 'transfer',
        ])
        ->assertRedirect(route('dashboard'));

    $service = Service::query()->first();
    expect($service)->not->toBeNull()
        ->and($service->payment_type)->toBe(PaymentType::Transfer);
});

test('no puede registrar servicio sin jornada activa', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('services.store'), [
            'order_cost' => 10,
            'delivery_cost' => 5,
        ])
        ->assertRedirect(route('dashboard'));

    expect(Service::query()->count())->toBe(0);
});

test('el formulario de crear servicio requiere jornada activa', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('services.create'))
        ->assertRedirect(route('dashboard'));
});

test('no puede registrar servicio en descanso', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);
    SessionEvent::factory()->for($session)->for($user)->create(['event_type' => SessionEventType::Break]);

    $this->actingAs($user)
        ->post(route('services.store'), [
            'order_cost' => 10,
            'delivery_cost' => 5,
        ])
        ->assertRedirect(route('dashboard'));

    expect(Service::query()->count())->toBe(0);
});

test('no puede abrir formulario de servicio en descanso', function () {
    $user = User::factory()->create();
    $session = WorkSession::factory()->for($user)->create(['status' => 'active']);
    SessionEvent::factory()->for($session)->for($user)->create(['event_type' => SessionEventType::Break]);

    $this->actingAs($user)
        ->get(route('services.create'))
        ->assertRedirect(route('dashboard'));
});
