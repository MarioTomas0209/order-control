<?php

namespace App\Models;

use App\Enums\PaymentType;
use App\Enums\ServiceStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Service extends Model
{
    /** @use HasFactory<\Database\Factories\ServiceFactory> */
    use HasFactory;

    /**
     * @var array<string, string>
     */
    protected $attributes = [
        'payment_type' => 'cash',
        'status' => 'pending',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'work_session_id',
        'user_id',
        'order_cost',
        'delivery_cost',
        'total_cost',
        'payment_type',
        'reported_amount',
        'status',
        'notes',
        'order_lines',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_cost' => 'decimal:2',
            'delivery_cost' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'reported_amount' => 'decimal:2',
            'payment_type' => PaymentType::class,
            'status' => ServiceStatus::class,
            'order_lines' => 'array',
        ];
    }

    /**
     * Servicios que cuentan para totales y listados operativos.
     *
     * @param  Builder<Service>  $query
     * @return Builder<Service>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', ServiceStatus::Pending);
    }

    public function isCancelled(): bool
    {
        return $this->status === ServiceStatus::Cancelled;
    }

    /**
     * @return BelongsTo<WorkSession, $this>
     */
    public function workSession(): BelongsTo
    {
        return $this->belongsTo(WorkSession::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
