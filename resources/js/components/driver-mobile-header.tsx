import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

export function DriverMobileHeader() {
    const page = usePage<SharedData>();
    const { auth, name: appName } = page.props;
    const getInitials = useInitials();

    return (
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex min-w-0 max-w-[calc(100%-5rem)] items-center gap-2 rounded-xl py-1 pr-1 text-left outline-none ring-offset-background transition hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label="Menú de cuenta"
                    >
                        <Avatar className="size-9 shrink-0 border border-border">
                            <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                            <AvatarFallback className="rounded-full bg-primary/10 text-sm font-medium text-primary">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight">{appName}</p>
                            <p className="text-muted-foreground truncate text-xs">Repartidor</p>
                        </div>
                        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-56 rounded-xl" align="start" sideOffset={8}>
                    <UserMenuContent user={auth.user} />
                </DropdownMenuContent>
            </DropdownMenu>
            <AppearanceToggleDropdown />
        </header>
    );
}
