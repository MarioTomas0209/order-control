<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->route('user');

        return $user instanceof User && ($this->user()?->can('update', $user) ?? false);
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('password') === '' || $this->input('password') === null) {
            $this->merge([
                'password' => null,
                'password_confirmation' => null,
            ]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($target->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::enum(UserRole::class)],
            'status' => ['required', Rule::enum(UserStatus::class)],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                /** @var User $target */
                $target = $this->route('user');
                $role = UserRole::tryFrom((string) $this->input('role'));
                $status = UserStatus::tryFrom((string) $this->input('status'));

                if ($role === null || $status === null) {
                    return;
                }

                if ($target->role !== UserRole::Admin) {
                    return;
                }

                $adminCount = User::query()->where('role', UserRole::Admin)->count();

                if ($adminCount <= 1 && $role !== UserRole::Admin) {
                    $validator->errors()->add(
                        'role',
                        'Debe existir al menos un administrador. No puedes cambiar el único administrador a repartidor.',
                    );
                }

                if ($adminCount <= 1 && $status !== UserStatus::Active) {
                    $validator->errors()->add(
                        'status',
                        'El único administrador debe permanecer activo.',
                    );
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'email' => 'correo electrónico',
            'phone' => 'teléfono',
            'password' => 'contraseña',
            'role' => 'rol',
            'status' => 'estado',
        ];
    }
}
