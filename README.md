# Mobile SaaS ERP

A comprehensive mobile ERP application built with React Native and Expo SDK 54, designed for managing business operations on the go.

## Features

### 📱 Core Modules
- **Dashboard** - Real-time business insights and analytics
- **Products** - Product catalog management with inventory tracking
- **Orders** - Order management and fulfillment tracking
- **Customers** - Customer relationship management
- **Inventory** - Stock management and movement tracking
- **Settings** - App configuration and user preferences

### 🔐 Authentication
- Secure user authentication
- Password reset functionality
- User profile management
- Role-based access control

### 📊 Analytics & Reporting
- Revenue trends and charts
- Order statistics
- Customer analytics
- Inventory alerts
- Real-time data synchronization

### 🎨 UI/UX Features
- Modern, intuitive interface
- Dark/Light theme support
- Responsive design for all screen sizes
- Smooth animations and transitions
- Offline data caching

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7
- **State Management**: Zustand
- **UI Components**: Custom component library
- **Charts**: React Native Chart Kit
- **Icons**: React Native Vector Icons
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Forms**: React Hook Form
- **Notifications**: Expo Notifications

## Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI
- Android Studio / Xcode (for device testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/mobile-saas-erp.git
cd mobile-saas-erp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API configuration
```

4. Start the development server:
```bash
npm start
```

5. Run on your device:
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://your-api-url.com/api
EXPO_PUBLIC_API_KEY=your-api-key-here

# Environment
EXPO_PUBLIC_ENVIRONMENT=development

# App Configuration
EXPO_PUBLIC_APP_NAME=Mobile SaaS ERP
EXPO_PUBLIC_APP_VERSION=1.0.0

# Features
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=false
```

## Project Structure

```
src/
├── api/                    # API layer and services
│   ├── auth.js            # Authentication endpoints
│   ├── products.js        # Product management
│   ├── orders.js          # Order management
│   ├── customers.js       # Customer management
│   ├── inventory.js       # Inventory management
│   ├── dashboard.js       # Dashboard analytics
│   └── index.js           # API exports
├── components/            # Reusable UI components
│   ├── common/            # General components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   ├── products/          # Product components
│   ├── orders/            # Order components
│   ├── customers/         # Customer components
│   ├── inventory/         # Inventory components
│   └── navigation/        # Navigation components
├── screens/               # Screen components
│   ├── auth/              # Authentication screens
│   ├── dashboard/         # Dashboard screens
│   ├── products/          # Product screens
│   ├── orders/            # Order screens
│   ├── customers/         # Customer screens
│   ├── inventory/         # Inventory screens
│   ├── settings/          # Settings screens
│   └── profile/           # Profile screens
├── hooks/                 # Custom React hooks
│   ├── useAuth.js         # Authentication hook
│   ├── useTheme.js        # Theme management
│   ├── useApi.js          # API utilities
│   └── useDebounce.js     # Debounce utility
├── store/                 # State management
│   ├── authStore.js       # Authentication state
│   ├── productStore.js    # Product state
│   ├── orderStore.js      # Order state
│   ├── customerStore.js   # Customer state
│   └── uiStore.js         # UI state
├── utils/                 # Utility functions
│   ├── constants.js       # App constants
│   ├── helpers.js         # Helper functions
│   ├── storage.js         # Storage utilities
│   └── validators.js      # Form validators
├── theme/                 # Theme configuration
│   ├── colors.js          # Color palette
│   ├── typography.js      # Typography definitions
│   └── index.js           # Theme exports
├── services/              # App services
│   └── notificationService.js # Notification handling
└── App.jsx               # Main app component
```

## API Integration

The app is designed to work with a RESTful API. Update the `EXPO_PUBLIC_API_URL` in your `.env` file to point to your backend server.

### API Endpoints Structure

- `/auth/*` - Authentication endpoints
- `/products/*` - Product management
- `/orders/*` - Order management
- `/customers/*` - Customer management
- `/inventory/*` - Inventory management
- `/dashboard/*` - Analytics and reporting

## Key Features Implementation

### Authentication Flow
1. User login with email/password
2. JWT token storage and refresh
3. Automatic token refresh
4. Secure logout

### Data Management
- Real-time data synchronization
- Offline data caching
- Optimistic updates
- Error handling and retry logic

### State Management
- Zustand for global state
- Component-level state for UI
- Persistent storage for user preferences

### Navigation
- Tab navigation for main modules
- Stack navigation for detail screens
- Deep linking support
- Navigation guards for protected routes

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow React Native best practices
- Implement proper error handling
- Write reusable components

### Testing
- Unit tests for utilities and hooks
- Integration tests for components
- E2E tests for critical user flows

### Performance
- Optimize images and assets
- Implement lazy loading
- Use memoization where appropriate
- Monitor bundle size

## Deployment

### Expo Go (Development)
```bash
expo start
```

### Development Build
```bash
expo install --fix
expo run:android
expo run:ios
```

### Production Build
```bash
expo build:android
expo build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Push notifications
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Integration with third-party services
- [ ] Role-based permissions
- [ ] Audit logs
- [ ] Data export functionality
