<?php

namespace App\Http\Controllers;

use App\Http\Resources\PlaceResource;
use App\Models\Place;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PlaceViewController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('places/index');
    }

    public function create(): Response
    {
        return Inertia::render('places/create');
    }

    public function edit(Place $place): Response
    {
        Gate::authorize('update', $place);

        return Inertia::render('places/edit', [
            'place' => (new PlaceResource($place))->resolve(),
        ]);
    }
}
