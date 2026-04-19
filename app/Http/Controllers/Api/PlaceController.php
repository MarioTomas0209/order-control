<?php

namespace App\Http\Controllers\Api;

use App\Enums\PlaceStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlaceRequest;
use App\Http\Requests\UpdatePlaceRequest;
use App\Http\Resources\PlaceResource;
use App\Models\Place;
use App\Models\User;
use App\Notifications\PlacePendingSuggestionNotification;
use App\Notifications\PlaceSuggestionRejectedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PlaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $places = Place::query()
            ->where('status', PlaceStatus::Approved)
            ->orderBy('name')
            ->paginate(30);

        return PlaceResource::collection($places);
    }

    public function search(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:120'],
        ]);

        $needle = $validated['q'];
        $places = Place::query()
            ->where('status', PlaceStatus::Approved)
            ->where(function ($query) use ($needle) {
                $query->where('name', 'like', '%'.$needle.'%')
                    ->orWhere('category', 'like', '%'.$needle.'%');
            })
            ->orderBy('name')
            ->paginate(30)
            ->appends(['q' => $needle]);

        return PlaceResource::collection($places);
    }

    /**
     * Categorías distintas ya usadas en locales aprobados (autocompletado al crear/editar).
     */
    public function categories(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $needle = isset($validated['q']) ? trim($validated['q']) : '';

        $query = Place::query()
            ->where('status', PlaceStatus::Approved)
            ->whereNotNull('category')
            ->where('category', '!=', '');

        if ($needle !== '') {
            $escaped = str_replace(
                ['\\', '%', '_'],
                ['\\\\', '\\%', '\\_'],
                Str::lower($needle),
            );
            $query->whereRaw('LOWER(category) LIKE ?', ['%'.$escaped.'%']);
        }

        $categories = $query
            ->selectRaw('category, COUNT(*) as place_count')
            ->groupBy('category')
            ->orderByDesc('place_count')
            ->orderBy('category')
            ->limit(25)
            ->pluck('category')
            ->values()
            ->all();

        return response()->json(['data' => $categories]);
    }

    public function store(StorePlaceRequest $request): JsonResponse
    {
        $data = $request->validated();
        unset($data['photo']);

        $data['status'] = PlaceStatus::Pending;
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('places', 'public');
        }

        $place = Place::query()->create($data);

        $submitter = $request->user();
        User::query()
            ->where('role', UserRole::Admin)
            ->whereKeyNot($submitter->id)
            ->each(function (User $admin) use ($place, $submitter): void {
                $admin->notify(new PlacePendingSuggestionNotification($place, $submitter));
            });

        return (new PlaceResource($place))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdatePlaceRequest $request, Place $place): JsonResponse
    {
        $data = $request->validated();
        unset($data['photo']);

        if ($request->hasFile('photo')) {
            if ($place->photo !== null) {
                Storage::disk('public')->delete($place->photo);
            }
            $data['photo'] = $request->file('photo')->store('places', 'public');
        }

        $place->update($data);

        return (new PlaceResource($place->fresh()))->response();
    }

    public function pending(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $user = $request->user();

        if ($user->role === UserRole::Admin) {
            $places = Place::query()
                ->where('status', PlaceStatus::Pending)
                ->with('creator')
                ->latest()
                ->paginate(30);
        } elseif ($user->role === UserRole::Driver) {
            $places = Place::query()
                ->where('status', PlaceStatus::Pending)
                ->where('created_by', $user->id)
                ->with('creator')
                ->latest()
                ->paginate(30);
        } else {
            abort(403);
        }

        return PlaceResource::collection($places);
    }

    public function approve(Request $request, Place $place): JsonResponse
    {
        Gate::authorize('approve', $place);

        $place->update([
            'status' => PlaceStatus::Approved,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        PlacePendingSuggestionNotification::dismissForPlace($place);

        return response()->json([
            'message' => 'Local aprobado.',
            'data' => new PlaceResource($place->fresh()),
        ]);
    }

    public function reject(Request $request, Place $place): JsonResponse
    {
        Gate::authorize('reject', $place);

        $submitter = $place->creator;

        $place->update([
            'status' => PlaceStatus::Rejected,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        PlacePendingSuggestionNotification::dismissForPlace($place);

        if ($submitter !== null && $submitter->isNot($request->user())) {
            $submitter->notify(new PlaceSuggestionRejectedNotification($place));
        }

        return response()->json([
            'message' => 'Local rechazado.',
            'data' => new PlaceResource($place->fresh()),
        ]);
    }
}
