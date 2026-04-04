<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('services') || Schema::hasColumn('services', 'order_lines')) {
            return;
        }

        Schema::table('services', function (Blueprint $table) {
            $table->json('order_lines')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('services') || ! Schema::hasColumn('services', 'order_lines')) {
            return;
        }

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('order_lines');
        });
    }
};
