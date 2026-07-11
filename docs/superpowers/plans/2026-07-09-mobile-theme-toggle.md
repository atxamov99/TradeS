# Mobile Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the multi-theme picker in the mobile app with a single light/dark toggle button, matching the web app's behavior (`web/src/store/themeStore.js` + `web/src/components/layout/Header.jsx`) and color palette.

**Architecture:** `ThemeContext.js` currently supports an arbitrary-length theme list (`themeList` + `setTheme(id)`). Since `mobile/src/constants/themes.js` only defines `light`/`dark` now, we replace that API with a boolean `isDark` + `toggleTheme()`, add one reusable `ThemeToggle` icon-button component, and wire it into the tab header and the two auth screens (which have no shared header). We then remove the old theme-list UI from `SettingsScreen.js` and fix a bug in `NewSaleScreen.js` where dark-mode detection still checks for the removed `'pos-dark'` theme id.

**Tech Stack:** React Native (Expo 54), `@react-native-async-storage/async-storage` for persistence, `@expo/vector-icons` (Ionicons), no test runner is configured in this project (no Jest/RNTL) — verification is manual, via reading the diff and (where possible) running the Expo app.

**Note on spec:** see `docs/superpowers/specs/2026-07-09-mobile-theme-toggle-design.md` for full design rationale.

---

### Task 1: Simplify `ThemeContext.js` to a boolean toggle

**Files:**
- Modify: `mobile/src/store/ThemeContext.js`

- [ ] **Step 1: Replace the theme-list API with `isDark`/`toggleTheme`**

Replace the full contents of `mobile/src/store/ThemeContext.js` with:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, DEFAULT_THEME, THEME_KEY } from '../constants/themes';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const defaultTheme = THEMES.find(t => t.id === DEFAULT_THEME);

const ThemeContext = createContext({
  theme: defaultTheme,
  colors: defaultTheme.colors,
  themeId: DEFAULT_THEME,
  isDark: DEFAULT_THEME === 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) setThemeId(saved);
      setLoaded(true);
    };
    load();
  }, []);

  const toggleTheme = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextId = themeId === 'dark' ? 'light' : 'dark';
    setThemeId(nextId);
    await AsyncStorage.setItem(THEME_KEY, nextId);
  };

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, colors: theme.colors, themeId, isDark: themeId === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

This removes `themeList` and `setTheme(id)` from the context value — every consumer of those two must be updated in the following tasks (Tasks 4 and 6), or the app will crash with "themeList is undefined" / "setTheme is not a function".

- [ ] **Step 2: Sanity-check for remaining references**

Run: `grep -rn "themeList\|setTheme(" mobile/src` (or use the Grep tool)
Expected at this point: matches still exist in `mobile/src/screens/SettingsScreen.js` — that's fine, Task 4 fixes it. No matches should exist anywhere else.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/store/ThemeContext.js
git commit -m "refactor(mobile): replace theme-list context API with isDark/toggleTheme"
```

---

### Task 2: Add the `ThemeToggle` component

**Files:**
- Create: `mobile/src/components/ui/ThemeToggle.js`

- [ ] **Step 1: Create the component**

```javascript
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';

export default function ThemeToggle({ style }) {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }, style]}
    >
      <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

This mirrors `web/src/components/layout/Header.jsx`'s toggle button: bordered circular button, `Sun`/`Moon` icon depending on current mode.

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/ui/ThemeToggle.js
git commit -m "feat(mobile): add ThemeToggle icon-button component"
```

---

### Task 3: Show the toggle in the tab header

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

- [ ] **Step 1: Import `ThemeToggle`**

Add near the other imports (after the `SettingsScreen` import, mobile/src/navigation/AppNavigator.js:17):

```javascript
import ThemeToggle from '../components/ui/ThemeToggle';
```

- [ ] **Step 2: Add `headerRight` to the shared tab screen options**

In `mobile/src/navigation/AppNavigator.js`, inside `MainTabs`, the `screenOptions={({ route }) => ({ ... })}` object currently ends with the `tabBarIcon` property (around line 88). Add a `headerRight` property to that same returned object:

```javascript
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'SalesStack') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'NewSale') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        headerRight: () => <ThemeToggle style={{ marginRight: 16 }} />,
```

This makes the toggle appear in the native header on all five tabs (Dashboard, Sales, Products, NewSale, Settings), since they all share this `screenOptions` object.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/navigation/AppNavigator.js
git commit -m "feat(mobile): show ThemeToggle in the tab header"
```

---

### Task 4: Remove the theme-list UI from `SettingsScreen.js`

**Files:**
- Modify: `mobile/src/screens/SettingsScreen.js`

- [ ] **Step 1: Drop `themeList`/`themeId`/`setTheme` from the destructure**

At `mobile/src/screens/SettingsScreen.js:46`, change:

```javascript
  const { colors, themeList, themeId, setTheme } = useTheme();
```

to:

```javascript
  const { colors } = useTheme();
```

- [ ] **Step 2: Remove the theme settings card block**

Delete this whole block (`mobile/src/screens/SettingsScreen.js:291-305`):

```javascript
      {renderSettingCard('settings.theme', (
        themeList.map((theme, idx) =>
          <View key={theme.id}>
            {renderRow(
              <View style={[styles.themeDot, { backgroundColor: theme.colors.accent }]} />,
              theme.name,
              () => setTheme(theme.id),
              themeId === theme.id
                ? <Ionicons name="checkmark" size={20} color={colors.accent} />
                : null,
              idx === themeList.length - 1
            )}
          </View>
        )
      ))}

```

(the blank line right after it, before `{renderSettingCard('settings.currency', ...`, can also be removed so there's exactly one blank line separating cards, matching the rest of the file's spacing).

- [ ] **Step 3: Remove the now-unused `themeDot` style**

Delete this from the `createStyles` `StyleSheet.create({...})` block (`mobile/src/screens/SettingsScreen.js:668-672`):

```javascript
  themeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
```

- [ ] **Step 4: Check `settings.theme` translation key usage**

Run: `grep -rn "settings.theme" mobile/src` (or use the Grep tool). If the only remaining reference was the block just deleted, no further action needed — leftover unused i18n keys in the translation JSON files are harmless and out of scope for this change.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/SettingsScreen.js
git commit -m "refactor(mobile): remove multi-theme picker from Settings"
```

---

### Task 5: Add the toggle to `LoginScreen.js`

**Files:**
- Modify: `mobile/src/screens/LoginScreen.js`

- [ ] **Step 1: Import `ThemeToggle` and read `isDark` from context**

At `mobile/src/screens/LoginScreen.js:19-21`, change:

```javascript
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
```

to:

```javascript
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
import ThemeToggle from '../components/ui/ThemeToggle';
```

At `mobile/src/screens/LoginScreen.js:25`, change:

```javascript
  const { colors } = useTheme();
```

to:

```javascript
  const { colors, isDark } = useTheme();
```

- [ ] **Step 2: Replace the ad-hoc dark check and add the toggle button**

At `mobile/src/screens/LoginScreen.js:76`, change:

```javascript
      <StatusBar style={colors.background === '#0F172A' ? 'light' : 'dark'} backgroundColor={colors.background} />
```

to:

```javascript
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <ThemeToggle style={styles.themeToggle} />
```

- [ ] **Step 3: Add the `themeToggle` style**

In the `StyleSheet.create({...})` block at the bottom of `mobile/src/screens/LoginScreen.js` (after the `flex` style, around line 146), add:

```javascript
  themeToggle: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/LoginScreen.js
git commit -m "feat(mobile): add ThemeToggle to LoginScreen"
```

---

### Task 6: Add the toggle to `RegisterScreen.js`

**Files:**
- Modify: `mobile/src/screens/RegisterScreen.js`

- [ ] **Step 1: Import `ThemeToggle` and read `isDark` from context**

At `mobile/src/screens/RegisterScreen.js:20-25`, add the import after the `useTheme` import:

```javascript
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
import { setToken, setUser } from '../store/authStore';
import { formatPhone } from '../utils/phoneFormatter';
import Input from '../components/ui/Input';
import ThemeToggle from '../components/ui/ThemeToggle';
```

At `mobile/src/screens/RegisterScreen.js:114-115`, replace the local hack:

```javascript
  const { colors } = useTheme();
  const isDark = colors.text === '#FFFFFF';
```

with:

```javascript
  const { colors, isDark } = useTheme();
```

- [ ] **Step 2: Add the toggle button into the existing top bar**

At `mobile/src/screens/RegisterScreen.js:182-190`, change:

```javascript
        {/* Top bar: back + step pills */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={[styles.backBtn, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.stepPills}>
            <View style={[styles.pill, { backgroundColor: colors.primary }]} />
            <View style={[styles.pill, { backgroundColor: stepNum >= 2 ? colors.primary : colors.border }]} />
          </View>
        </View>
```

to:

```javascript
        {/* Top bar: back + step pills + theme toggle */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={[styles.backBtn, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.stepPills}>
            <View style={[styles.pill, { backgroundColor: colors.primary }]} />
            <View style={[styles.pill, { backgroundColor: stepNum >= 2 ? colors.primary : colors.border }]} />
          </View>
          <ThemeToggle style={{ marginLeft: 14 }} />
        </View>
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/RegisterScreen.js
git commit -m "feat(mobile): add ThemeToggle to RegisterScreen"
```

---

### Task 7: Fix the stale `'pos-dark'` check in `NewSaleScreen.js`

**Files:**
- Modify: `mobile/src/screens/NewSaleScreen.js`

**Context:** `mobile/src/constants/themes.js` already renamed the dark theme's `id` from `'pos-dark'` to `'dark'` (uncommitted, unrelated to this plan). `NewSaleScreen.js:35` still checks the old id, so `isDark` is now always `false` there regardless of the active theme — a real (if currently invisible) bug. Task 1 exposes `isDark` directly on the context, so this becomes a one-line fix.

- [ ] **Step 1: Use context's `isDark` instead of the stale id check**

At `mobile/src/screens/NewSaleScreen.js:33-35`, change:

```javascript
  const { colors, themeId } = useTheme();
  ...
  const isDark = themeId === 'pos-dark';
```

to:

```javascript
  const { colors, isDark } = useTheme();
```

(Read the surrounding lines first — line 33 and line 35 are not adjacent; keep whatever is currently on the lines in between unchanged, only remove the `themeId` destructure and the old `isDark` assignment line.)

- [ ] **Step 2: Verify the only usage still makes sense**

Run: `grep -n "isDark" mobile/src/screens/NewSaleScreen.js` (or use the Grep tool)
Expected: one remaining usage at the `variant={isDark ? "pos" : "primary"}` line, now correctly reflecting the active theme.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/NewSaleScreen.js
git commit -m "fix(mobile): NewSaleScreen dark-mode detection used removed 'pos-dark' theme id"
```

---

### Task 8: Manual verification

**No automated test runner is configured for this project** (no Jest/React Native Testing Library, no lint script in `mobile/package.json`). Verification is manual:

- [ ] **Step 1: Start the app**

Run: `cd mobile && npx expo start`
Open on a simulator/device/Expo Go.

- [ ] **Step 2: Walk through the checklist**

- [ ] Login screen shows a circular sun/moon button top-right; tapping it flips light/dark instantly.
- [ ] Register screen shows the same button in the top bar next to the step pills; tapping it flips light/dark.
- [ ] Once logged in, every tab (Dashboard, Sales, Products, New Sale, Settings) shows the toggle button in the header; tapping it from any tab flips the whole app's theme.
- [ ] Settings screen no longer shows a "Theme" section with a list of color options.
- [ ] Force-close and reopen the app: the last chosen theme (light or dark) is still applied (AsyncStorage persistence).
- [ ] On the New Sale screen, the "primary" action button visually switches between `"primary"` and `"pos"` variants correctly when toggling theme (confirms the Task 7 fix).

- [ ] **Step 3: Report back**

If anything in the checklist fails, note which step and what was observed — that's a bug to fix before considering this plan done, not something to paper over.
