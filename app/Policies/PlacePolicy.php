<?php

namespace App\Policies;

use App\Enums\PlaceStatus;
use App\Enums\UserRole;
use App\Models\Place;
use App\Models\User;

class PlacePolicy
{
    public function create(User $user): bool
    {
        return $user->role === UserRole::Driver || $user->role === UserRole::Admin;
    }

    public function approve(User $user, Place $place): bool
    {
        return $user->role === UserRole::Admin && $place->status === PlaceStatus::Pending;
    }

    public function reject(User $user, Place $place): bool
    {
        return $user->role === UserRole::Admin && $place->status === PlaceStatus::Pending;
    }

    public function update(User $user, Place $place): bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        return $user->role === UserRole::Driver
            && $place->created_by === $user->id
            && $place->status === PlaceStatus::Pending;
    }
}
