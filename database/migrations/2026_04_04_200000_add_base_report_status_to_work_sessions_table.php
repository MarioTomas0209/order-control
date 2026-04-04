<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('work_sessions') || Schema::hasColumn('work_sessions', 'base_report_status')) {
            return;
        }

        Schema::table('work_sessions', function (Blueprint $table) {
            $table->string('base_report_status', 30)->default('pending')->after('status');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('work_sessions') || ! Schema::hasColumn('work_sessions', 'base_report_status')) {
            return;
        }

        Schema::table('work_sessions', function (Blueprint $table) {
            $table->dropColumn('base_report_status');
        });
    }
};
