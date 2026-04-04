<?php

test('el manifiesto PWA es público y devuelve JSON válido', function () {
    $response = $this->get('/manifest.webmanifest');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/manifest+json');
    expect($response->json('name'))->not->toBeEmpty();
    expect($response->json('icons'))->toBeArray()->not->toBeEmpty();
});
