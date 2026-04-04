<?php

namespace App\Enums;

enum SessionEventType: string
{
    case Start = 'start';
    case Break = 'break';
    case Resume = 'resume';
    case Finish = 'finish';
}
