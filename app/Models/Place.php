<?php

namespace App\Models;

use App\Enums\PlaceStatus;
use Database\Factories\PlaceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Place extends Model
{
    /** @use HasFactory<PlaceFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'category',
        'phone',
        'whatsapp',
        'address',
        'google_maps_link',
        'latitude',
        'longitude',
        'photo',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => PlaceStatus::class,
            'latitude' => 'float',
            'longitude' => 'float',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
