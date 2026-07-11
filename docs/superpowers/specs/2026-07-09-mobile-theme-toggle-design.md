# Mobile theme toggle — design

## Goal
Replace the multi-theme picker in the mobile app with a single light/dark toggle, matching the web app's behavior and color palette exactly.

## Current state
- `mobile/src/constants/themes.js` already trims `THEMES` down to `light`/`dark` (uncommitted change), using the same green brand palette as `web/tailwind.config.js` (`#2ECC71` primary, `#0F172A`/`#1E293B`/`#334155` POS dark). This data is correct as-is and is not touched by this spec.
- `mobile/src/store/ThemeContext.js` exposes `themeList` + `setTheme(id)`, built for an arbitrary-length theme list.
- `SettingsScreen.js` renders `themeList` as a row-list with a colored dot + checkmark per theme.
- No theme toggle exists on `LoginScreen.js` / `RegisterScreen.js`.
- Web precedent: `web/src/store/themeStore.js` exposes `theme` + `toggleTheme()` (flips `light`↔`dark`, persisted). UI is a single icon button (`web/src/components/layout/Header.jsx`): 36x36, bordered, `Sun` icon when dark / `Moon` icon when light. Auth pages (`Login.jsx`, `Register.jsx`, `ForgotPasswordPage.jsx`) repeat the same button locally since they aren't wrapped by `Header`.

## Changes

**1. `ThemeContext.js`**
Add `isDark` (boolean) and `toggleTheme()` (flips `themeId` between `'light'`/`'dark'`, persists via existing `AsyncStorage`/`THEME_KEY`). Remove `themeList` and `setTheme(id)` from the exposed context value — nothing else will need arbitrary theme selection.

**2. New component `mobile/src/components/ui/ThemeToggle.js`**
Circular icon button, 36x36, border `colors.border`, background `colors.card`. Ionicons `sunny-outline` when `isDark`, `moon-outline` when light. Calls `toggleTheme()` on press.

**3. Placement**
- `AppNavigator.js`: add `headerRight: () => <ThemeToggle />` to the shared `screenOptions` in `MainTabs`, so it appears in the native header on all five tabs (Dashboard, Sales, Products, NewSale, Settings).
- `LoginScreen.js` / `RegisterScreen.js`: render `<ThemeToggle />` absolutely positioned top-right (inside the `SafeAreaView`/top container), since these screens have no shared header.

**4. `SettingsScreen.js` cleanup**
Remove the `settings.theme` card block (theme list with colored dot + checkmark), the now-unused `themeDot` style, and the `themeList`/`setTheme` destructuring.

## Out of scope
- Any change to theme color values (already correct).
- Cross-device data sync between mobile and web (separate, larger effort — tracked separately, not part of this spec).

## Testing
- Manual: toggle theme from a tab screen, confirm it persists across app restart (AsyncStorage), confirm Login/Register screens toggle and reflect the same persisted state.
