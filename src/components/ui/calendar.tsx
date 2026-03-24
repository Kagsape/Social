"use client";

import React from 'react';
import { Calendar as CalendarBase } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn as clsx } from 'clsx';

const Calendar = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CalendarBase>) => {
  return (
    <CalendarBase
      className={cn(
        'rounded-lg border bg-background text-foreground border-muted-foreground',
        className
      )}
      containerProps={{
        className: 'space-y-2',
      }}
      components={{
        // Fixed component name
        IconLeft: ({ className: iconClassName, ...iconProps }) => (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-l-md border-r border-border/50',
              iconClassName
            )}
            {...iconProps}
          >
            <ChevronLeft className={cn("h-4 w-4", iconClassName)} />
          </Button>
        ),
        IconRight: ({ className: iconClassName, ...iconProps }) => (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-r-md',
              iconClassName
            )}
            {...iconProps>
            <ChevronRight className={cn("h-4 w-4", iconClassName)} />
          </Button>
        ),
        // Other components...
      }}
      {...props}
    />
  );
};

export default Calendar;