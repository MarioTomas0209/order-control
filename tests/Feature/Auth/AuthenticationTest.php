<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('login incluye canResetPassword para mostrar ¿Olvidaste tu contraseña?', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auth/login')
            ->where('canResetPassword', true));
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('recordarme guarda token y permite sesión persistente', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
        'remember' => true,
    ])->assertRedirect(route('dashboard', absolute: false));

    expect($user->fresh()->remember_token)->not->toBeNull();
});

test('login sin recordarme no guarda token de recuerdo', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
        // Sin el campo `remember`: equivale a desmarcar el checkbox en el navegador.
    ])->assertRedirect(route('dashboard', absolute: false));

    expect($user->fresh()->remember_token)->toBeNull();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});