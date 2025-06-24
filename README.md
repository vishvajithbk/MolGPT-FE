# MolGPT - Molecular Generation Platform

A clean, modular, and accessible web application for AI-powered molecular generation with multiple generation modes.

## 🏗️ Architecture Overview

This application has been completely refactored to follow modern web development best practices:

- **Component-based JavaScript architecture** with ES6 modules
- **BEM CSS methodology** for maintainable styling
- **Semantic HTML** with accessibility features
- **Event-driven communication** between components
- **Fixed-size containers** to prevent layout shifts
- **Responsive design** with mobile support

## 📁 Project Structure

```
MolGPT frontend/
├── index.html                 # Main HTML file with semantic structure
├── styles/
│   └── main.css              # Modular CSS with BEM methodology
├── scripts/
│   ├── main.js               # Application entry point
│   ├── components/           # Reusable UI components
│   │   ├── ModeSelector.js   # Dropdown mode selection
│   │   ├── ModeManager.js    # Mode-specific content management
│   │   ├── PropertyForm.js   # Property configuration form
│   │   ├── GenerationController.js # API communication & generation
│   │   └── ResultsDisplay.js # Results visualization
│   └── utils/                # Utility modules
│       ├── EventBus.js       # Component communication
│       └── UIStateManager.js # Global UI state management
├── svg and png files/        # Application assets
└── README.md                 # This file
```

## 🚀 Features

### Generation Modes
- **De Novo Generation**: Create completely novel molecules from scratch
- **Scaffold Decoration**: Decorate core structures with R-groups
- **Fragment Linking**: Connect molecular fragments with novel linkers
- **Molecular Transformation**: Generate similar or modified molecules


### User Experience
- **Fixed-size mode container** prevents layout shifts during mode switching
- **Real-time form validation** with visual feedback
- **Accessible interface** with ARIA attributes and keyboard navigation
- **Responsive design** works on desktop, tablet, and mobile
- **Loading states** and error handling for better UX

### Technical Features
- **Modular component architecture** for maintainability
- **Event-driven communication** between components
- **Input validation** and sanitization
- **File upload support** for SMILES files
- **API integration** with error handling and timeout management

## 🛠️ Component Architecture

### Core Components

#### ModeSelector
Manages the dropdown for selecting generation modes.
- Accessible dropdown with keyboard navigation
- Click-outside-to-close functionality
- ARIA attributes for screen readers

#### ModeManager
Handles mode-specific content display and form management.
- Fixed container size prevents layout shifts
- Smooth transitions between modes
- Dynamic form validation

#### PropertyForm
Manages property configuration (samples, temperature).
- Real-time validation and bounds checking
- Live slider updates
- Input sanitization

#### GenerationController
Coordinates the molecule generation process.
- Form validation before API calls
- Request cancellation support
- Error handling and retry logic

#### ResultsDisplay
Handles the display of generation results.
- Formatted molecule display
- Loading and error states
- Accessibility features

### Utility Modules

#### EventBus
Provides centralized event management for component communication.
- Pub/sub pattern for loose coupling
- Namespace support
- Error handling and debugging

#### UIStateManager
Manages global UI state and visual feedback.
- Loading state coordination
- Error state management
- Accessibility state updates

## 🎨 CSS Architecture

The CSS follows the **BEM (Block Element Modifier)** methodology:

```css
/* Block */
.mode-selector { }

/* Element */
.mode-selector__trigger { }
.mode-selector__menu { }

/* Modifier */
.mode-selector--open { }
.mode-selector__option--selected { }
```

### CSS Custom Properties
All colors, spacing, and other design tokens are defined as CSS custom properties for easy theming and maintenance:

```css
:root {
  --color-primary: #3C3C3C;
  --space-md: 12px;
  --border-radius-md: 12px;
}
```

### Responsive Design
The layout uses modern CSS techniques:
- **Flexbox** for component layouts
- **CSS Grid** where appropriate
- **Media queries** for responsive breakpoints
- **Container queries** for component-level responsiveness

## 🔧 Key Design Decisions

### Fixed-Size Mode Container
The mode configuration container has a **fixed height (500px)** to prevent layout shifts when switching between modes. This ensures a stable user experience.

```css
.mode-config__content {
  height: 500px; /* Fixed height prevents layout shifts */
  overflow: hidden;
}
```

### Event-Driven Architecture
Components communicate through a centralized EventBus rather than direct references, promoting loose coupling:

```javascript
// Component A emits an event
this.eventBus.emit('mode:changed', newMode);

// Component B listens for the event
this.eventBus.on('mode:changed', this.handleModeChange);
```

### Input Validation
All form inputs are validated in real-time with visual feedback:
- **Immediate validation** on input change
- **Visual indicators** for valid/invalid states
- **Accessibility announcements** for screen readers

### Error Handling
Comprehensive error handling throughout the application:
- **Network request timeouts**
- **Form validation errors**
- **API error responses**
- **User-friendly error messages**

## 🎯 Accessibility Features

- **Semantic HTML** with proper heading hierarchy
- **ARIA attributes** for screen readers
- **Keyboard navigation** support
- **Focus management** for modal interactions
- **Color contrast** compliance
- **Responsive text** scaling
- **Screen reader announcements** for state changes

## 📱 Browser Support

- **Modern browsers** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **ES6 modules** support required
- **CSS Grid** and **Flexbox** support
- **Fetch API** for network requests

## 🚀 Getting Started

1. **Serve the files** through a web server (required for ES6 modules)
2. **Ensure API server** is running at `https://dispatch-multimedia-foundation-simply.trycloudflare.com`
3. **Open** `index.html` in a supported browser

### Development Server
For development, you can use any static file server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (http-server)
npx http-server

# Using Live Server (VS Code extension)
# Right-click index.html → "Open with Live Server"
```

## 🔍 Performance Considerations

- **Lazy loading** of components
- **Event delegation** for efficient event handling
- **Debounced input** handling for performance
- **CSS animations** with hardware acceleration
- **Minimal DOM manipulation**
- **Efficient re-rendering** strategies

## 🧪 Testing Considerations

The modular architecture facilitates testing:
- **Unit tests** for individual components
- **Integration tests** for component interactions
- **E2E tests** for user workflows
- **Accessibility testing** with screen readers

## 📈 Future Enhancements

Potential improvements and extensions:
- **Offline support** with service workers
- **Progressive Web App** features
- **Advanced validation** with custom rules
- **Batch processing** for multiple generations
- **Result export** functionality
- **Theming system** for customization

## 🤝 Contributing

When contributing to this codebase:
1. **Follow BEM naming** conventions for CSS
2. **Use semantic HTML** elements
3. **Implement accessibility** features
4. **Add comprehensive comments**
5. **Test across browsers** and devices
6. **Validate with accessibility** tools

## 📄 License

This project is part of the MolGPT molecular generation platform.

---

**Built with modern web standards and accessibility in mind** ✨
