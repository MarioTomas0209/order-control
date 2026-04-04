<?php

namespace App\Http\Requests;

use App\Enums\PaymentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('payment_type')) {
            $this->merge(['payment_type' => PaymentType::Cash->value]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'order_cost' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'delivery_cost' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'payment_type' => ['required', Rule::enum(PaymentType::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'order_lines' => ['nullable', 'array', 'max:100'],
            'order_lines.*.label' => ['required', 'string', 'max:200'],
            'order_lines.*.amount' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'order_cost' => 'costo del pedido',
            'delivery_cost' => 'costo de envío',
            'payment_type' => 'tipo de pago',
            'notes' => 'notas',
            'order_lines' => 'lista del pedido',
            'order_lines.*.label' => 'producto',
            'order_lines.*.amount' => 'monto del producto',
        ];
    }
}
