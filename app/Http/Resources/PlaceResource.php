<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PlaceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'address' => $this->address,
            'google_maps_link' => $this->google_maps_link,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'photo_url' => $this->photo ? Storage::disk('public')->url($this->photo) : null,
            'notes' => $this->notes,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'created_by' => $this->created_by,
            'creator_name' => $this->whenLoaded('creator', fn () => $this->creator->name),
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
