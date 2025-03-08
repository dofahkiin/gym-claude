# GymTracker Design System Guide

This comprehensive guide explains the GymTracker design system, including component usage, style patterns, and best practices for maintaining design consistency.

## Table of Contents

1. [Core Design Principles](#core-design-principles)
2. [File Structure](#file-structure)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Component Library](#component-library)
6. [Usage Examples](#usage-examples)
7. [Dark Mode](#dark-mode)
8. [Best Practices](#best-practices)

## Core Design Principles

The GymTracker design system is built on these fundamental principles:

1. **Consistency** - Use the same design patterns throughout the application
2. **Simplicity** - Keep components simple and focused
3. **Reusability** - Create components that can be used in multiple contexts
4. **Accessibility** - Ensure the interface is usable by everyone
5. **Responsiveness** - Design for all screen sizes

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # UI component library
│   │   │   ├── index.js     # Export all components
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Input.js
│   │   │   └── ...
│   │   ├── Home.js
│   │   ├── Login.js
│   │   └── ...
│   ├── index.css            # Main CSS with component classes
│   └── ...
├── tailwind.config.js       # Tailwind configuration
└── postcss.config.js        # PostCSS configuration
```

## Color Palette

The GymTracker color palette is defined in `tailwind.config.js` and uses CSS variables for consistency. The primary colors are indigo and purple, with a range of gray shades for UI elements.

### Primary Colors

- Primary: Indigo (`--color-primary`, `theme('colors.indigo.600')`)
- Secondary: Purple (`--color-secondary`, `theme('colors.purple.600')`)

### Semantic Colors

- Success: Green (`--color-success`, `theme('colors.green.500')`)
- Error: Red (`--color-error`, `theme('colors.red.500')`)
- Warning: Yellow (`--color-warning`, `theme('colors.yellow.500')`)
- Info: Blue (`--color-info`, `theme('colors.blue.500')`)

### Using Colors

Use predefined classes like `btn-primary` rather than applying color utilities directly.

## Typography

The GymTracker app uses the Inter font family as its primary typeface. Font sizes are defined using Tailwind's size classes.

### Font Family

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Font Weights

- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Text Sizes

Use Tailwind's text size utilities: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, etc.

## Component Library

GymTracker's component library is located in `src/components/ui/`. All components are exported from the `index.js` file for easy importing.

### Core Components

#### Button

Used for user actions. Variants include primary, secondary, and danger.

```jsx
import { Button } from './ui';

// Basic usage
<Button>Click Me</Button>

// With variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Dangerous Action</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Rounded
<Button rounded>Rounded Button</Button>

// Full width
<Button fullWidth>Full Width</Button>

// Loading state
<Button loading>Loading...</Button>
```

#### Card

Container for related content.

```jsx
import { Card } from './ui';

// Basic usage
<Card>
  <div className="p-6">Card content goes here</div>
</Card>

// With header
<Card
  title="Card Title"
  subtitle="Optional subtitle"
>
  <div className="p-6">Card content</div>
</Card>

// With gradient header
<Card
  title="Card with Gradient"
  gradientHeader
>
  <div className="p-6">Card content</div>
</Card>

// With custom header content
<Card
  headerContent={
    <div className="flex justify-between items-center">
      <h3>Custom Header</h3>
      <button>Action</button>
    </div>
  }
>
  <div className="p-6">Card content</div>
</Card>
```

#### Input

Form input component with label and error handling.

```jsx
import { Input } from './ui';

// Basic usage
<Input
  id="email"
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With error message
<Input
  id="password"
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  error="Password must be at least 8 characters"
/>

// Required field
<Input
  id="username"
  label="Username"
  required
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

#### Alert

Used for important messages.

```jsx
import { Alert } from './ui';

// Basic usage
<Alert type="info">This is an informational message</Alert>

// Different types
<Alert type="success">Operation completed successfully</Alert>
<Alert type="error">An error occurred</Alert>
<Alert type="warning">Warning: This action cannot be undone</Alert>

// Dismissible alert
<Alert type="info" dismissible onDismiss={() => setShowAlert(false)}>
  Dismissible alert
</Alert>
```

#### Loading

Loading indicator.

```jsx
import { Loading } from './ui';

// Basic spinner
<Loading />

// With text
<Loading text="Loading data..." />

// Different sizes
<Loading size="sm" />
<Loading size="md" />
<Loading size="lg" />

// Full page loading
<Loading fullPage text="Please wait..." />
```

### App-Specific Components

#### WorkoutCard

Card specifically for workout items.

```jsx
import { WorkoutCard } from './ui';

<WorkoutCard
  id="1"
  name="Workout A"
  exerciseCount={5}
  completionStatus="In Progress"
/>
```

#### ExerciseSet

Component for exercise sets.

```jsx
import { ExerciseSet } from './ui';

<ExerciseSet
  index={0}
  set={{ weight: 60, reps: 10, completed: false }}
  onWeightChange={(index, value) => handleWeightChange(index, value)}
  onRepsChange={(index, value) => handleRepsChange(index, value)}
  onCompletionToggle={(index) => handleCompletionToggle(index)}
  isWorkoutActive={true}
/>
```

#### Notification

Toast notification component.

```jsx
import { Notification } from './ui';

<Notification
  message="Workout saved successfully"
  type="success"
  onDismiss={() => setNotification(null)}
/>
```

## Usage Examples

Here are some examples of using the component library in page components:

### Login Page

```jsx
import React, { useState } from 'react';
import { Card, Input, Button, Alert } from './ui';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Login logic
      onLogin({ email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md w-full mx-auto">
      <Card
        gradientHeader
        headerContent={
          <div className="px-6 py-8 text-center">
            <h2 className="text-2xl font-bold">Welcome to GymTracker</h2>
            <p className="mt-2 text-indigo-200">Sign in to continue</p>
          </div>
        }
      >
        <div className="p-6">
          {error && (
            <Alert type="error" className="mb-4">{error}</Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Input
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Sign in
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
```

## Dark Mode

GymTracker supports dark mode with a class-based implementation. The dark mode state is stored in localStorage and toggled with the ThemeToggle component.

### Implementing Dark Mode Classes

When creating new CSS classes, always include dark mode variants:

```css
.card {
  @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.dark .card {
  @apply bg-gray-800;
}
```

## Best Practices

1. **Use Components Over Direct Styles**
   - Always use the component library components instead of creating one-off styled elements

2. **Follow Naming Conventions**
   - Use PascalCase for component names
   - Use camelCase for variables and functions

3. **Keep Components Pure**
   - Components should be pure and focused on a single responsibility
   - Use props for configuration instead of creating multiple similar components

4. **Document Everything**
   - Add JSDoc comments to all components
   - Include prop descriptions and examples

5. **Test Across Devices**
   - Ensure the design works well on mobile, tablet, and desktop
   - Test both light and dark mode

6. **Avoid Inline Styles**
   - Use the CSS classes defined in `index.css`
   - Create new classes for new patterns rather than using inline styles

7. **Maintain Consistency**
   - Use the same patterns for similar functionality
   - Don't reinvent patterns that already exist in the design system

8. **Component Library First**
   - When adding new UI elements, first check if they should be added to the component library
   - Specialized, one-off components can be created directly in feature components
   - Common UI patterns should be added to the component library

By following these guidelines, you'll maintain a consistent, high-quality user interface throughout the GymTracker application.