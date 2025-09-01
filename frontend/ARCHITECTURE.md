# Frontend Architecture

## 🏗️ **New Structure (Refactored)**

```
src/
├── App.tsx                    # 🎯 Main app - clean 80 lines
├── components/
│   ├── ReadingMode.tsx        # 📖 Reading functionality  
│   ├── PracticeMode.tsx       # 🎯 Practice functionality
│   ├── InterpretationPanel.tsx # 🔮 Shared card interpretation panel
│   └── SpreadRenderer.tsx     # 🃏 Shared spread visualization
├── hooks/
│   └── useCardData.ts         # 🔗 Shared data logic & API calls
└── types/
    └── spreads.ts             # 📝 TypeScript type definitions
```

## ✅ **Benefits of This Architecture**

### **Separation of Concerns**
- **App.tsx** (80 lines): Only handles routing, layout, shared state
- **ReadingMode.tsx** (160 lines): Only handles reading logic  
- **PracticeMode.tsx** (existing): Only handles practice logic
- **useCardData.ts** (120 lines): Only handles data fetching & processing

### **Reusability**
- **Shared components**: InterpretationPanel, SpreadRenderer
- **Shared logic**: Card data, spread configurations, interpretations
- **Shared utilities**: Category colors, card key formatting

### **Maintainability**
- **Single responsibility**: Each file has one clear purpose
- **Easy to find code**: Feature-based organization
- **Independent development**: Can work on reading/practice separately
- **Easier testing**: Smaller, focused components

### **Scalability**
- **Easy to add new modes**: Just create new component + add to App.tsx
- **Easy to add new features**: Extend existing components or create new ones
- **Easy to share logic**: Custom hooks for cross-feature functionality

## 📊 **Before vs After**

| Aspect | Before | After |
|--------|--------|-------|
| App.tsx size | 415 lines | 80 lines |
| Concerns in App | Reading + Practice + Data + UI | Routing + Layout only |
| Code reuse | Duplicated logic | Shared hooks and utilities |
| Testing | Hard to test mixed concerns | Easy to test isolated features |
| New features | Modify large App file | Create focused components |

## 🔄 **Data Flow**

```
App.tsx
  ├── useCardData() hook → API calls, shared state
  ├── ReadingMode → Reading-specific UI & logic
  ├── PracticeMode → Practice-specific UI & logic  
  └── InterpretationPanel → Shared interpretation display
```

## 🎯 **React Best Practices Applied**

1. **Custom Hooks**: Extract shared logic into `useCardData`
2. **Component Composition**: Break large components into focused ones
3. **Props Interface**: Clear prop typing for all components
4. **Single Responsibility**: Each component has one job
5. **Shared State Management**: Lift state to appropriate level
6. **Code Reuse**: Shared utilities and components

This is a textbook example of clean React architecture! 🚀