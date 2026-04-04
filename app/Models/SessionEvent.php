<?php

namespace App\Models;

use App\Enums\SessionEventType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionEvent extends Model
{
    /** @use HasFactory<\Database\Factories\SessionEventFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'work_session_id',
        'user_id',
        'event_type',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'event_type' => SessionEventType::class,
        ];
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
