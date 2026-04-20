'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';

import {
  ThemeToggler as ThemeTogglerPrimitive,
  type ThemeTogglerProps as ThemeTogglerPrimitiveProps,
  type ThemeSelection,
  type Resolved,
} from '@/components/animate-ui/primitives/effects/theme-toggler';
import { buttonVariants } from '@/components/animate-ui/components/buttons/icon';
import { cn } from '@/lib/utils';
import {
  getStoredTheme,
  setTheme as setSiteTheme,
  type SiteTheme,
} from '@/shared/theme/theme';

const getNextTheme = (
  effective: ThemeSelection,
  modes: ThemeSelection[],
): ThemeSelection => {
  const i = modes.indexOf(effective);
  if (i === -1) return modes[0];
  return modes[(i + 1) % modes.length];
};

type ThemeTogglerButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    modes?: ThemeSelection[];
    onImmediateChange?: ThemeTogglerPrimitiveProps['onImmediateChange'];
    direction?: ThemeTogglerPrimitiveProps['direction'];
    theme?: SiteTheme;
    onThemeChange?: (theme: SiteTheme) => void;
    label?: React.ReactNode;
    renderIcon?: (theme: SiteTheme) => React.ReactNode;
    unstyled?: boolean;
  };

function ThemeTogglerButton({
  variant = 'default',
  size = 'default',
  modes = ['light', 'dark'],
  direction = 'ltr',
  onImmediateChange,
  onThemeChange,
  onClick,
  className,
  theme: controlledTheme,
  label,
  renderIcon,
  unstyled = false,
  ...props
}: ThemeTogglerButtonProps) {
  const [uncontrolledTheme, setUncontrolledTheme] = React.useState<SiteTheme>(
    () => controlledTheme ?? getStoredTheme(),
  );

  React.useEffect(() => {
    if (controlledTheme) {
      setUncontrolledTheme(controlledTheme);
      return undefined;
    }

    const syncTheme = () => setUncontrolledTheme(getStoredTheme());

    window.addEventListener('storage', syncTheme);
    window.addEventListener('tripzy-theme-change', syncTheme as EventListener);

    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener(
        'tripzy-theme-change',
        syncTheme as EventListener,
      );
    };
  }, [controlledTheme]);

  const theme = controlledTheme ?? uncontrolledTheme;
  const resolvedTheme = theme;

  const setTheme = (nextTheme: ThemeSelection) => {
    const nextSiteTheme: SiteTheme = nextTheme === 'dark' ? 'dark' : 'light';
    const appliedTheme = setSiteTheme(nextSiteTheme);
    setUncontrolledTheme(appliedTheme);
    onThemeChange?.(appliedTheme);
  };

  const icon =
    renderIcon?.(resolvedTheme) ??
    (resolvedTheme === 'dark' ? <Sun /> : <Moon />);

  return (
    <ThemeTogglerPrimitive
      theme={theme}
      resolvedTheme={resolvedTheme as Resolved}
      setTheme={setTheme}
      direction={direction}
      onImmediateChange={onImmediateChange}
    >
      {({ effective, resolved, toggleTheme }) => (
        <button
          data-slot="theme-toggler-button"
          className={cn(
            unstyled ? className : buttonVariants({ variant, size, className }),
          )}
          onClick={(e) => {
            onClick?.(e);
            toggleTheme(getNextTheme(effective, modes));
          }}
          {...props}
        >
          {renderIcon?.(resolved) ?? icon}
          {label}
        </button>
      )}
    </ThemeTogglerPrimitive>
  );
}

export { ThemeTogglerButton, type ThemeTogglerButtonProps };
