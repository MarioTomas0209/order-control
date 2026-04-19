<?php

use App\Enums\PlaceStatus;
use App\Enums\UserRole;
use App\Models\Place;
use App\Models\User;
use App\Notifications\PlacePendingSuggestionNotification;
use App\Notifications\PlaceSuggestionRejectedNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Storage;

test('api places requiere autenticación', function () {
    $this->getJson('/api/places')->assertUnauthorized();
});

test('api categorías de locales requiere autenticación', function () {
    $this->getJson('/api/places/categories')->assertUnauthorized();
});

test('api categorías lista valores distintos de locales aprobados filtrados por q', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    Place::factory()->approved()->create(['category' => 'Taquería', 'created_by' => $user->id]);
    Place::factory()->approved()->create(['category' => 'Taquería', 'created_by' => $user->id]);
    Place::factory()->approved()->create(['category' => 'Farmacia', 'created_by' => $user->id]);
    Place::factory()->create([
        'category' => 'Secreto pendiente',
        'created_by' => $user->id,
        'status' => PlaceStatus::Pending,
    ]);

    $this->actingAs($user)
        ->getJson('/api/places/categories?q='.urlencode('TAQ'))
        ->assertOk()
        ->assertJsonPath('data.0', 'Taquería')
        ->assertJsonMissingPath('data.1');
});

test('api categorías sin q devuelve las más usadas entre aprobados', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    Place::factory()->approved()->create(['category' => 'A', 'created_by' => $user->id]);
    Place::factory()->approved()->create(['category' => 'A', 'created_by' => $user->id]);
    Place::factory()->approved()->create(['category' => 'B', 'created_by' => $user->id]);

    $this->actingAs($user)
        ->getJson('/api/places/categories')
        ->assertOk()
        ->assertJsonPath('data.0', 'A')
        ->assertJsonPath('data.1', 'B');
});

test('lista solo locales aprobados', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    Place::factory()->approved()->create([
        'name' => 'Visible',
        'created_by' => $user->id,
        'notes' => 'Entrada por el costado',
    ]);
    Place::factory()->create(['name' => 'Oculto', 'created_by' => $user->id, 'status' => PlaceStatus::Pending]);

    $this->actingAs($user)
        ->getJson('/api/places')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Visible')
        ->assertJsonPath('data.0.notes', 'Entrada por el costado')
        ->assertJsonMissingPath('data.1');
});

test('búsqueda por nombre', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    Place::factory()->approved()->create(['name' => 'Pizza Norte', 'category' => 'Restaurante', 'created_by' => $user->id]);
    Place::factory()->approved()->create(['name' => 'Otro', 'category' => 'Farmacia', 'created_by' => $user->id]);

    $this->actingAs($user)
        ->getJson('/api/places/search?q='.urlencode('Pizza'))
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Pizza Norte');
});

test('el repartidor puede enviar una sugerencia pendiente', function () {
    Storage::fake('public');
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);

    $photo = UploadedFile::fake()->image('fachada.jpg', 640, 480);

    $this->actingAs($driver)->post('/api/places', [
        'name' => 'Carnitas López',
        'category' => 'Taquería',
        'phone' => '5551234567',
        'whatsapp' => '5215512345678',
        'address' => 'Calle Falsa 123',
        'google_maps_link' => 'https://www.google.com/maps?q=Calle+Falsa+123',
        'latitude' => '19.432608',
        'longitude' => '-99.133209',
        'notes' => 'Abre tarde',
        'photo' => $photo,
    ])->assertCreated();

    $place = Place::query()->where('name', 'Carnitas López')->first();
    expect($place)->not->toBeNull()
        ->and($place->status)->toBe(PlaceStatus::Pending)
        ->and($place->photo)->not->toBeNull();

    Storage::disk('public')->assertExists($place->photo);
});

test('el repartidor solo ve sus locales pendientes en el listado', function () {
    $driverA = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    $driverB = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    Place::factory()->create(['created_by' => $driverA->id, 'name' => 'Mío', 'status' => PlaceStatus::Pending]);
    Place::factory()->create(['created_by' => $driverB->id, 'name' => 'Del otro', 'status' => PlaceStatus::Pending]);

    $this->actingAs($driverA)
        ->getJson('/api/places/pending')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Mío')
        ->assertJsonMissingPath('data.1');
});

test('el repartidor no puede aprobar locales', function () {
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    $place = Place::factory()->create(['created_by' => $driver->id]);

    $this->actingAs($driver)
        ->postJson(route('api.places.approve', $place, absolute: false))
        ->assertForbidden();
});

test('el admin puede listar pendientes y aprobar', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    $place = Place::factory()->create(['created_by' => $driver->id, 'name' => 'Por aprobar']);

    $this->actingAs($admin)
        ->getJson('/api/places/pending')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Por aprobar');

    $this->actingAs($admin)
        ->postJson(route('api.places.approve', $place, absolute: false))
        ->assertOk();

    expect($place->fresh()->status)->toBe(PlaceStatus::Approved)
        ->and($place->fresh()->approved_by)->toBe($admin->id);
});

test('al crear sugerencia se notifica a los administradores y se limpia al aprobar', function () {
    Storage::fake('public');
    $adminA = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
    $adminB = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($driver)->post('/api/places', [
        'name' => 'Sushi Express',
        'category' => 'Restaurante',
        'phone' => '',
        'whatsapp' => '',
        'address' => 'Av. Principal 1',
        'google_maps_link' => 'https://www.google.com/maps?q=Sushi',
        'notes' => '',
    ])->assertCreated();

    expect(DatabaseNotification::query()->count())->toBe(2);

    $place = Place::query()->where('name', 'Sushi Express')->first();
    expect($place)->not->toBeNull();

    $this->actingAs($adminA)
        ->postJson(route('api.places.approve', $place, absolute: false))
        ->assertOk();

    expect(DatabaseNotification::query()->count())->toBe(0);
});

test('el admin puede rechazar', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
    $driver = User::factory()->create(['email_verified_at' => now()]);
    $place = Place::factory()->create(['created_by' => $driver->id]);

    $this->actingAs($admin)
        ->postJson(route('api.places.reject', $place, absolute: false))
        ->assertOk();

    expect($place->fresh()->status)->toBe(PlaceStatus::Rejected);
});

test('al rechazar se notifica al repartidor que envió la sugerencia', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    $place = Place::factory()->create([
        'created_by' => $driver->id,
        'name' => 'Marisquería del Puerto',
    ]);

    expect($driver->unreadNotifications)->toHaveCount(0);

    $this->actingAs($admin)
        ->postJson(route('api.places.reject', $place, absolute: false))
        ->assertOk();

    $driver->refresh();

    expect($driver->unreadNotifications)->toHaveCount(1)
        ->and($driver->unreadNotifications->first()->type)->toBe(PlaceSuggestionRejectedNotification::class)
        ->and($driver->unreadNotifications->first()->data['place_name'])->toBe('Marisquería del Puerto');
});

test('el repartidor puede marcar como leídos los avisos de rechazo', function () {
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    $place = Place::factory()->rejected()->create([
        'created_by' => $driver->id,
        'name' => 'Café Central',
    ]);
    $driver->notify(new PlaceSuggestionRejectedNotification($place));

    expect($driver->fresh()->unreadNotifications)->toHaveCount(1);

    $this->actingAs($driver)
        ->post(route('notifications.place-rejected.dismiss', absolute: false))
        ->assertRedirect();

    expect($driver->fresh()->unreadNotifications)->toHaveCount(0);
});

test('el repartidor puede editar su propio local pendiente', function () {
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    $place = Place::factory()->create([
        'created_by' => $driver->id,
        'name' => 'Nombre viejo',
        'category' => 'Tienda',
        'address' => 'Calle 1',
        'google_maps_link' => 'https://www.google.com/maps?q=1',
        'status' => PlaceStatus::Pending,
    ]);

    $this->actingAs($driver)->patch(route('api.places.update', $place, absolute: false), [
        'name' => 'Nombre nuevo',
        'category' => 'Tienda',
        'phone' => '',
        'whatsapp' => '',
        'address' => 'Calle 2',
        'google_maps_link' => 'https://www.google.com/maps?q=2',
        'notes' => '',
    ])->assertOk();

    expect($place->fresh()->name)->toBe('Nombre nuevo');
});

test('el repartidor no puede editar un local ya aprobado', function () {
    $driver = User::factory()->create([
        'role' => UserRole::Driver,
        'email_verified_at' => now(),
    ]);
    $place = Place::factory()->approved()->create(['created_by' => $driver->id]);

    $this->actingAs($driver)->patch(route('api.places.update', $place, absolute: false), [
        'name' => 'Hack',
        'category' => 'X',
        'phone' => '',
        'whatsapp' => '',
        'address' => 'Y',
        'google_maps_link' => 'https://www.google.com/maps?q=z',
        'notes' => '',
    ])->assertForbidden();
});

test('actualizar local con multipart y POST spoof a PATCH persiste los datos', function () {
    Storage::fake('public');
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
    $driver = User::factory()->create(['email_verified_at' => now()]);
    $place = Place::factory()->approved()->create(['created_by' => $driver->id, 'name' => 'Antes']);

    $photo = UploadedFile::fake()->image('f.jpg', 10, 10);

    $this->actingAs($admin)
        ->post(
            route('api.places.update', $place, absolute: false),
            [
                '_method' => 'PATCH',
                'name' => 'Después',
                'category' => 'Restaurante',
                'phone' => '',
                'whatsapp' => '',
                'address' => 'Calle X',
                'google_maps_link' => 'https://www.google.com/maps?q=x',
                'notes' => '',
                'photo' => $photo,
            ],
            ['Accept' => 'application/json', 'X-Requested-With' => 'XMLHttpRequest'],
        )
        ->assertOk();

    expect($place->fresh()->name)->toBe('Después')
        ->and($place->fresh()->photo)->not->toBeNull();
});

test('el administrador puede editar un local aprobado', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);
    $driver = User::factory()->create(['email_verified_at' => now()]);
    $place = Place::factory()->approved()->create(['created_by' => $driver->id, 'name' => 'Viejo']);

    $this->actingAs($admin)->patch(route('api.places.update', $place, absolute: false), [
        'name' => 'Actualizado por admin',
        'category' => 'Restaurante',
        'phone' => '',
        'whatsapp' => '',
        'address' => 'Nueva dirección',
        'google_maps_link' => 'https://www.google.com/maps?q=n',
        'notes' => '',
    ])->assertOk();

    expect($place->fresh()->name)->toBe('Actualizado por admin');
});

test('al rechazar se eliminan las notificaciones del local', function () {
    User::factory()->create(['role' => UserRole::Admin, 'email_verified_at' => now()]);
    User::factory()->create(['role' => UserRole::Admin, 'email_verified_at' => now()]);
    $driver = User::factory()->create(['role' => UserRole::Driver, 'email_verified_at' => now()]);

    $this->actingAs($driver)->post('/api/places', [
        'name' => 'Panadería Sur',
        'category' => 'Tienda',
        'phone' => '',
        'whatsapp' => '',
        'address' => 'Calle 2',
        'google_maps_link' => 'https://www.google.com/maps?q=Pan',
        'notes' => '',
    ])->assertCreated();

    expect(DatabaseNotification::query()->count())->toBe(2);

    $place = Place::query()->where('name', 'Panadería Sur')->first();
    $admin = User::query()->where('role', UserRole::Admin)->first();

    $this->actingAs($admin)
        ->postJson(route('api.places.reject', $place, absolute: false))
        ->assertOk();

    expect(DatabaseNotification::query()->where('type', PlacePendingSuggestionNotification::class)->count())->toBe(0)
        ->and(DatabaseNotification::query()->where('type', PlaceSuggestionRejectedNotification::class)->count())->toBe(1);
});
