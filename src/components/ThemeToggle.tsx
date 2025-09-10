import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC<{
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
}> = ({ className, iconClassName, showLabel = false }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Only render UI that depends on the theme when mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('animate-pulse', className)}
        aria-label="Loading theme"
        disabled
      >
        <SunMoon className={cn('h-5 w-5', iconClassName)} />
      </Button>
    );
  }

  const toggleTheme = () => {
    setIsActive(true);
    setTheme(theme === 'dark' ? 'light' : 'dark');
    
    // Reset animation state after animation completes
    setTimeout(() => setIsActive(false), 200);
  };

  const getThemeIcon = () => {
    if (theme === 'dark') {
      return <Sun className={cn('h-5 w-5', iconClassName)} />;
    } else if (theme === 'light') {
      return <Moon className={cn('h-5 w-5', iconClassName)} />;
    }
    return <SunMoon className={cn('h-5 w-5', iconClassName)} />;
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return 'Light Mode';
    if (theme === 'light') return 'Dark Mode';
    return 'System Theme';
  };

  return (
    <Button
      variant="ghost"
      size={showLabel ? 'default' : 'icon'}
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'hover:bg-background/80 dark:hover:bg-background/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        {
          'animate-pulse': isActive,
        },
        className
      )}
      aria-label={`Toggle theme, currently ${theme} mode`}
    >
      <div className={cn(
        'flex items-center justify-center gap-2',
        'transition-transform duration-300',
        {
          'scale-110': isHovered,
          'rotate-12': isHovered && theme === 'dark',
          '-rotate-12': isHovered && theme === 'light',
        }
      )}>
        {getThemeIcon()}
        {showLabel && (
          <span className="text-sm font-medium">
            {getThemeLabel()}
          </span>
        )}
      </div>
      <span className="sr-only">
        {theme === 'dark' 
          ? 'Switch to light mode' 
          : theme === 'light' 
            ? 'Switch to dark mode' 
            : 'Toggle theme'}
      </span>
    </Button>
  );
};
