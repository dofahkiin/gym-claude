# GymTracker Design System

This document outlines the design system for the GymTracker app, explaining how design elements are organized and how to maintain them going forward.

## Core Design Files

### 1. `src/index.css`

This is the main CSS file that contains:
- Tailwind imports
- CSS variables for consistent theming
- Base styles
- Component classes

All custom styling should be added to this file using the `@layer` directive to organize styles into the appropriate Tailwind layers.

### 2. `tailwind.config.js`

Contains Tailwind configuration:
- Color palette definitions
- Font family settings
- Extended theme properties
- Dark mode configuration
- Plugin settings

When adding new design tokens, they should be defined here first.

### 3. `postcss.config.js` 

Controls the processing of CSS with plugins like Tailwind and Autoprefixer.

## Design System Structure

The design system is organized into layers:

### 1. Base Styles
Base HTML element styling, CSS variables, and fundamental typography.

```css
@layer base {
  body {
    @apply font-sans text-gray-900 transition-colors duration-200;
  }
}
```

### 2. Component Classes
Reusable UI components like cards, buttons, forms, alerts, etc.

```css
@layer components {
  .card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }
  
  .btn-primary {
    @apply bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md;
  }
}
```

### 3. Utility Classes
Small, single-purpose utilities that can be applied directly in HTML.

## Key Component Classes

Below are the key component classes that have been extracted from the JavaScript files:

### Layout Components
- `.app-container`: Main app container
- `.main-header`: Top navigation bar
- `.main-content`: Content container

### UI Components
- `.card`: Basic card component
- `.card-gradient-header`: Gradient header for cards
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`: Button styles
- `.btn-rounded`: Rounded button variation
- `.form-input`, `.form-label`: Form element styles
- `.alert`, `.alert-error`, `.alert-success`: Alert components
- `.progress-bar`, `.progress-value`: Progress indicators
- `.timer-bar`, `.timer-green`, `.timer-yellow`, `.timer-red`: Timer components
- `.loading-spinner`, `.loading-container`: Loading indicators
- `.notification`, `.notification-success`, `.notification-error`: Toast notifications
- `.workout-card`, `.workout-active-card`, `.workout-inactive-card`: Workout-specific cards

## Dark Mode

Dark mode is implemented using Tailwind's class-based dark mode strategy. Dark mode variants are included directly within component classes:

```css
.card {
  @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.dark .card {
  @apply bg-gray-800;
}
```

## CSS Variables

CSS variables are defined at the root level for consistent theming:

```css
:root {
  --color-primary: theme('colors.indigo.600');
  --color-primary-dark: theme('colors.indigo.900');
  --color-secondary: theme('colors.purple.600');
  /* ... */
}
```

## Adding New Components

When adding new components:

1. First, check if an existing component class can be used
2. If not, create a new component class in `src/index.css` under the appropriate layer
3. Include both light and dark mode variants
4. Use the component class in your JSX instead of inline Tailwind classes

## Maintaining the Design System

1. **Be Consistent**: Use the established patterns and variables
2. **Don't Repeat**: Reuse existing components when possible
3. **Document**: Add comments for complex patterns
4. **Update**: Modify the design system files rather than adding inline styles to components
5. **Test**: Always verify both light and dark mode appearances

## Component Usage Examples

### Before (inline Tailwind classes):
```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
  <div className="p-6">
    <h3 className="font-bold text-gray-800 dark:text-gray-100">Heading</h3>
  </div>
</div>
```

### After (using component classes):
```jsx
<div className="card">
  <div className="p-6">
    <h3 className="font-bold text-gray-800 dark:text-gray-100">Heading</h3>
  </div>
</div>
```

Following these guidelines will help maintain a consistent design system and make future design changes easier to implement.