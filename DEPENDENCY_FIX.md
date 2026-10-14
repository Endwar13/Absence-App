# Dependency Conflict Fix - npm install ERESOLVE Error

## Issue Summary

Error yang terjadi saat menjalankan `npm install`:

```
npm error code ERESOLVE
npm error ERESOLVE could not resolve

Found: esbuild@0.25.12
Could not resolve dependency:
peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.3.4
```

## Root Cause

Project memiliki `esbuild@0.25.0` tetapi `vite@8.3.4` memerlukan `esbuild@^0.27.0 || ^0.28.0`. Ini adalah **peer dependency conflict**.

## Solution Applied

### Changes to `package.json`

**Before:**
```json
{
  "devDependencies": {
    "esbuild": "^0.25.0",
    ...
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.43.0",
    "react-router-dom": "^6.20.0",
    ...
  },
  "devDependencies": {
    "esbuild": "^0.28.0",
    ...
  }
}
```

### What Changed

1. **Updated esbuild**: `^0.25.0` → `^0.28.0`
   - Matches vite@8.3.4 peer dependency requirement
   - esbuild@0.28.2 installed (compatible with tsx and vite)

2. **Added Supabase Package**: `@supabase/supabase-js@^2.43.0`
   - Required untuk backend integration
   - Sudah ada di services tetapi belum di package.json

3. **Added React Router**: `react-router-dom@^6.20.0`
   - Required untuk routing (used in pages)
   - Sudah di-import tetapi belum di package.json

## Dependency Resolution

```
✓ esbuild@0.28.2 (installed)
  ├─ Satisfies vite@8.3.4 peer dependency: "^0.27.0 || ^0.28.0"
  ├─ Satisfies tsx@4.21.0 peer dependency: "^0.27.0 || ^0.28.0"
  └─ Satisfies @tailwindcss/vite@4.3.3

✓ @supabase/supabase-js@2.117.3 (installed)
  └─ Required for backend services

✓ react-router-dom@6.30.6 (installed)
  └─ Required for page routing
```

## Installation Result

```
✓ added 193 packages in 1m
✓ No ERESOLVE errors
✓ Build verified: npm run build ✅
```

## Manual Fix (If Needed)

Jika ingin fix manual:

```bash
# Option 1: Update package.json manually
# Edit devDependencies: "esbuild": "^0.28.0"

# Option 2: Use npm install with legacy flag
npm install --legacy-peer-deps

# Option 3: Force resolution
npm install --force

# Then clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Files Modified

1. `package.json`
   - Updated devDependencies esbuild
   - Added dependencies for Supabase & React Router

2. `.env.local` (created from .env.example)
   - Supabase credentials already populated

## Verification

```bash
# Check esbuild version
npm list esbuild
# Output: esbuild@0.28.2 ✓

# Check Supabase installed
npm list @supabase/supabase-js
# Output: @supabase/supabase-js@2.117.3 ✓

# Check React Router installed
npm list react-router-dom
# Output: react-router-dom@6.30.6 ✓

# Verify build works
npm run build
# Output: ✓ built in 377ms ✓
```

## Why This Happened

1. **Package.json outdated**: Original package.json had older esbuild
2. **Dependencies drift**: As Vite and Tailwind updated, peer deps changed
3. **Missing dependencies**: Supabase and React Router were imported but not declared

## Prevention for Future

1. Keep `package.json` updated with latest stable versions
2. Run `npm audit` regularly to check for issues
3. Use `npm ci` in production instead of `npm install` for reproducible builds
4. Pin exact versions for critical dependencies
5. Test after each major dependency update

## Related Files

- **package.json** - Updated version specifications
- **.env.local** - Supabase credentials
- **QUICKSTART.md** - Getting started guide
- **supabase/SETUP.md** - Detailed setup

## Status

✅ **RESOLVED**

All dependencies now correctly installed and build verified.

---

**Fix Date**: October 14, 2026  
**Resolved by**: Kiro AI  
**Status**: Complete ✓
