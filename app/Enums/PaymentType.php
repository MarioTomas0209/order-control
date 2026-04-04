<?php

namespace App\Enums;

enum PaymentType: string
{
    case Cash = 'cash';
    case Transfer = 'transfer';
    case Card = 'card';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Efectivo',
            self::Transfer => 'Transferencia',
            self::Card => 'Tarjeta',
        };
    }
}
