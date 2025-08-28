# Refactoring Plan for Series Detail Components

## Current Situation

The application has two nearly identical components for series details:
- `SeriesDetailCreator.tsx`: Used for the creator domain
- `SeriesDetailViewer.tsx`: Used for the viewer domain

Both components have very similar functionality but differ in:
1. Domain setting (creator vs viewer)
2. Navigation paths
3. UI styling (colors and some components)
4. Read-only restrictions in viewer mode

## Proposed Solution: Component Composition Pattern

### 1. Create Base Component

Create a base `SeriesDetailBase` component that contains the shared logic and structure:

```tsx
// SeriesDetailBase.tsx
import { ReactNode } from 'react';
import type { Series } from '../types';

interface SeriesDetailBaseProps {
  series: Series;
  onSeriesUpdate: (series: Series) => void;
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  activeTab: 'content' | 'flashcards' | 'widgets';
  onTabChange: (tab: 'content' | 'flashcards' | 'widgets') => void;
  readOnly: boolean;
  navigationElement: ReactNode;
  headerActionsElement: ReactNode;
  tabColors: {
    active: string;
    inactiveHover: string;
  };
}

export function SeriesDetailBase({
  series,
  onSeriesUpdate,
  currentPageIndex,
  onPageChange,
  activeTab,
  onTabChange,
  readOnly,
  navigationElement,
  headerActionsElement,
  tabColors,
}: SeriesDetailBaseProps) {
  // Common rendering logic
  // ...
}
```

### 2. Refactor Domain-Specific Components

Refactor the domain-specific components to use composition:

```tsx
// SeriesDetailCreator.tsx
export function SeriesDetailCreator() {
  // Domain-specific state and handlers
  // ...
  
  return series ? (
    <SeriesDetailBase
      series={series}
      onSeriesUpdate={handleSeriesUpdate}
      currentPageIndex={currentPageIndex}
      onPageChange={handlePageChange}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      readOnly={false}
      navigationElement={/* Creator-specific navigation */}
      headerActionsElement={/* Creator-specific actions */}
      tabColors={{ active: 'blue-600', inactiveHover: 'gray-300' }}
    />
  ) : (
    <LoadingOrError isLoading={isLoading} error={error} />
  );
}
```

### 3. Create Shared Utility Functions

Extract common logic into utility functions:

```tsx
// seriesDetailUtils.ts
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
```

## Benefits

1. **Reduced code duplication**: Most logic lives in a single component
2. **Easier maintenance**: Changes only need to be made in one place
3. **Better separation of concerns**: Domain-specific vs shared UI logic
4. **Better extensibility**: New domains or views can reuse the base component

## Implementation Steps

1. Create shared utility functions
2. Create the base component with shared logic
3. Refactor SeriesDetailCreator to use composition
4. Refactor SeriesDetailViewer to use composition
5. Test all functionality
6. Remove any redundant code
