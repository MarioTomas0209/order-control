<?php

namespace App\Enums;

enum ServiceStatus: string
{
    case Pending = 'pending';
    case Cancelled = 'cancelled';
}
