<?php

namespace App\Enums;

enum BaseReportStatus: string
{
    case Pending = 'pending';
    case ReportReceived = 'report_received';
    case Reconciled = 'reconciled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente de reporte',
            self::ReportReceived => 'Reporte recibido',
            self::Reconciled => 'Conciliada',
        };
    }
}
