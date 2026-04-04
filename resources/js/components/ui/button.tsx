import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                blue: 'bg-blue-600 dark:bg-blue-900 text-white hover:bg-blue-700 dark:hover:bg-blue-800',
                green: 'bg-green-600 dark:bg-green-900 text-white hover:bg-green-700 dark:hover:bg-green-800',
                red: 'bg-red-600 dark:bg-red-900 text-white hover:bg-red-700 dark:hover:bg-red-800',
                yellow: 'bg-yellow-600 dark:bg-yellow-900 text-white hover:bg-yellow-700 dark:hover:bg-yellow-800',
                purple: 'bg-purple-600 dark:bg-purple-900 text-white hover:bg-purple-700 dark:hover:bg-purple-800',
                orange: 'bg-orange-600 dark:bg-orange-900 text-white hover:bg-orange-700 dark:hover:bg-orange-800',
                pink: 'bg-pink-600 dark:bg-pink-900 text-white hover:bg-pink-700 dark:hover:bg-pink-800',
                teal: 'bg-teal-600 dark:bg-teal-900 text-white hover:bg-teal-700 dark:hover:bg-teal-800',
                cyan: 'bg-cyan-600 dark:bg-cyan-900 text-white hover:bg-cyan-700 dark:hover:bg-cyan-800',
                indigo: 'bg-indigo-600 dark:bg-indigo-900 text-white hover:bg-indigo-700 dark:hover:bg-indigo-800',
                gray: 'bg-gray-600 dark:bg-gray-900 text-white hover:bg-gray-700 dark:hover:bg-gray-800',
                lime: 'bg-lime-600 dark:bg-lime-900 text-white hover:bg-lime-700 dark:hover:bg-lime-800',
                emerald: 'bg-emerald-600 dark:bg-emerald-900 text-white hover:bg-emerald-700 dark:hover:bg-emerald-800',
                sky: 'bg-sky-600 dark:bg-sky-900 text-white hover:bg-sky-700 dark:hover:bg-sky-800',
                violet: 'bg-violet-600 dark:bg-violet-900 text-white hover:bg-violet-700 dark:hover:bg-violet-800',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
