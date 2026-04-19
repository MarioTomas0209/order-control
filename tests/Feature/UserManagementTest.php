<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function verifiedAdminUser(): User
{
    return User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
}

function verifiedDriverUser(): User
{
    return User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
}

test('los repartidores no pueden listar usuarios', function () {
    $this->actingAs(verifiedDriverUser())
        ->get(route('users.index', absolute: false))
        ->assertForbidden();
});

test('los administradores ven el listado de usuarios', function () {
    $admin = verifiedAdminUser();

    $this->actingAs($admin)
        ->get(route('users.index', absolute: false))
        ->assertSuccessful()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('users/index')
            ->has('users.data'));
});

test('un administrador puede crear un usuario', function () {
    $admin = verifiedAdminUser();

    $this->actingAs($admin)->post(route('users.store', absolute: false), [
        'name' => 'Nuevo repartidor',
        'email' => 'nuevo-rep@test.test',
        'phone' => '5551234567',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::Driver->value,
        'status' => UserStatus::Active->value,
    ])->assertRedirect(route('users.index', absolute: false));

    $created = User::query()->where('email', 'nuevo-rep@test.test')->first();

    expect($created)->not->toBeNull()
        ->and($created->role)->toBe(UserRole::Driver)
        ->and($created->status)->toBe(UserStatus::Active);
});

test('un administrador puede actualizar un usuario sin cambiar la contraseña', function () {
    $admin = verifiedAdminUser();
    $target = User::factory()->create([
        'email_verified_at' => now(),
        'name' => 'Antes',
        'role' => UserRole::Driver,
    ]);

    $this->actingAs($admin)->patch(route('users.update', $target, absolute: false), [
        'name' => 'Después',
        'email' => $target->email,
        'phone' => '',
        'password' => '',
        'password_confirmation' => '',
        'role' => UserRole::Driver->value,
        'status' => UserStatus::Active->value,
    ])->assertRedirect(route('users.index', absolute: false));

    expect($target->refresh()->name)->toBe('Después');
});

test('no se puede degradar al único administrador a repartidor', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)->patch(route('users.update', $admin, absolute: false), [
        'name' => $admin->name,
        'email' => $admin->email,
        'phone' => $admin->phone ?? '',
        'password' => '',
        'password_confirmation' => '',
        'role' => UserRole::Driver->value,
        'status' => UserStatus::Active->value,
    ])->assertSessionHasErrors('role');
});

test('no se puede eliminar la propia cuenta desde el listado', function () {
    $admin = verifiedAdminUser();

    $this->actingAs($admin)->delete(route('users.destroy', $admin, absolute: false))->assertForbidden();
});

test('un administrador puede eliminar a otro usuario', function () {
    $admin = verifiedAdminUser();
    $other = verifiedDriverUser();

    $this->actingAs($admin)->delete(route('users.destroy', $other, absolute: false))->assertRedirect(route('users.index', absolute: false));

    expect(User::query()->find($other->id))->toBeNull();
});
