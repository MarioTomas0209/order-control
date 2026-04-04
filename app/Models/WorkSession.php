<?php

namespace App\Models;

use App\Enums\BaseReportStatus;
use App\Enums\SessionEventType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkSession extends Model
{
    /** @use HasFactory<\Database\Factories\WorkSessionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'start_time',
        'end_time',
        'initial_cash',
        'final_cash',
        'status',
        'base_report_status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'initial_cash' => 'decimal:2',
            'final_cash' => 'decimal:2',
            'base_report_status' => BaseReportStatus::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Service, $this>
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    /**
     * @return HasMany<SessionEvent, $this>
     */
    public function sessionEvents(): HasMany
    {
        return $this->hasMany(SessionEvent::class);
    }

    public function isOnBreak(): bool
    {
        $last = $this->sessionEvents()->latest('id')->first();

        return $last !== null && $last->event_type === SessionEventType::Break;
    }
}
