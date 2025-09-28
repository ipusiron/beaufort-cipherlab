# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beaufort CipherLab is an interactive web-based educational tool for learning and visualizing the pure Beaufort cipher, a classical cryptographic technique. The tool demonstrates the pure Beaufort cipher implementation and compares it with the Vigenère cipher.

## Technology Stack

- **Pure frontend**: Vanilla JavaScript (no build tools, no frameworks)
- **HTML/CSS**: Static web pages styled with custom CSS
- **Deployment**: GitHub Pages (see demo at https://ipusiron.github.io/beaufort-cipherlab/)

## How to Run

Open `index.html` directly in a browser - no build process required.

For development with live reload:
```bash
# Any local server works, for example:
python -m http.server 8000
# or
npx http-server
```

## Code Architecture

### Module Structure

The application follows a modular structure with separate JavaScript files:

- **normalize.js**: Text normalization utilities (uppercase conversion, non-alpha handling, character-to-index conversion)
- **beaufort.js**: Core cipher algorithms - implements both pure `C = (K - P) mod 26` and variant `C = (P - K) mod 26` modes
- **visualize.js**: 26×26 matrix visualization, highlighting row/column intersections during encryption/decryption
- **toaster.js**: Toast notification system for user feedback
- **app.js**: Main application controller - handles UI interactions, state management, and coordinates between modules

All modules attach to `window` global (e.g., `window.Norm`, `window.Beaufort`, `window.Viz`, `window.Toast`).

### Key Concepts

**Beaufort Cipher:**
- **Encryption**: `C = (K - P) mod 26`
- **Decryption**: `P = (K - C) mod 26`
- **Self-reciprocal property**: Encryption and decryption use the same form of operation

**Matrix Highlighting:**
- Encryption: row=K, col=P
- Decryption: row=K, col=C

**Key Expansion:**
The `Norm.expandKey()` function handles repeating the keyword to match plaintext length. When `skipOnNonAlpha` is true, the key doesn't advance for non-alphabetic characters (placeholder `·` is used).

### State Management

Encryption and decryption each maintain separate state objects:
- `encState` / `decState`: Track current position (`i`), input text, key, playback status
- Step-by-step visualization uses timer-based animation
- State resets on "最初から" (reset) button

### UI Tabs

Four main tabs in `index.html`:
1. **鍵生成 (Key Generation)**: Expands keyword to match plaintext length
2. **暗号化 (Encryption)**: Encrypt with step-by-step or bulk mode
3. **復号 (Decryption)**: Decrypt with step-by-step or bulk mode
4. **座学 (Learn)**: Educational content about Beaufort cipher

## Keyboard Shortcuts

- `Ctrl+Enter`: Bulk encrypt/decrypt on active tab
- `Space`: Play/pause animation
- `→`: Step forward one character
- `Esc`: Reset to beginning

## Code Conventions

- Use IIFE pattern: `(function(global) { ... })(window);`
- Prefix private functions with nothing; export via global namespace
- Use `$` for `querySelector`, `$$` for `querySelectorAll`
- Event listeners use arrow functions for conciseness
- No semicolons optional (but existing code includes them)
- CSS classes use kebab-case (e.g., `hi-row`, `hi-col`, `hi-cell`)

## Internationalization

The UI is in Japanese. When making changes:
- Keep button labels in Japanese (例: "暗号化", "復号", "一括実行")
- Toast messages are in Japanese
- Code comments can be in English
- Mathematical notation follows Japanese conventions (例: 「K − P」)