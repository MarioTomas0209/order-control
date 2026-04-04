import { useEffect, useState } from 'react';

export function useMinWidth(minWidth: number): boolean {
    const [matches, setMatches] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${minWidth}px)`).matches : true,
    );

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
        const onChange = () => setMatches(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [minWidth]);

    return matches;
}
