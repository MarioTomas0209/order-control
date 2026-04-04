<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('work_sessions')->where('status', 'closed')->update(['status' => 'finished']);
    }

    public function down(): void
    {
        DB::table('work_sessions')->where('status', 'finished')->update(['status' => 'closed']);
    }
};
