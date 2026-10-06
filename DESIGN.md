---
name: NexoU Authentication
description: Native Android and iOS login and registration matching the supplied campus references.
colors:
  navy: "#0F3D62"
  navy-dark: "#0A2C46"
  cta: "#063963"
  turquoise: "#14B3A0"
  interactive-teal: "#08796E"
  selected-role: "#E0F6F3"
  canvas: "#F6FBFF"
  surface: "#FFFFFF"
  text: "#0E2A3F"
  muted: "#596C80"
  tagline: "#536475"
  field-border: "#DCE2E9"
  divider: "#CFD8E1"
  radio-border: "#B8C3CD"
  danger: "#DC2626"
typography:
  headline: {fontSize: "28px", fontWeight: 800}
  label: {fontSize: "15px", fontWeight: 700}
  input: {fontSize: "14px"}
  button: {fontSize: "16px", fontWeight: 700, letterSpacing: "0.2px"}
rounded:
  field: "12px"
  login-sheet: "24px"
  register-sheet: "22px"
spacing:
  gutter: "16px"
  login-sheet: "20px"
  register-sheet: "16px"
components:
  button-login: {backgroundColor: "{colors.cta}", textColor: "{colors.surface}", height: "54px", rounded: "20px", padding: "12px 24px"}
  button-register: {backgroundColor: "{colors.cta}", textColor: "{colors.surface}", height: "50px", rounded: "18px", padding: "12px 24px"}
---
# Design System: NexoU Authentication

## Overview
Scope: `LoginScreen`, `RegisterScreen`, and their shared auth components in React Native for Android/iOS. The supplied references establish campus artwork above, the navy/turquoise NexoU logo, white icon fields, navy actions, and lower waves. Other screens retain their existing designs.

## Colors
Navy anchors headings and icons; turquoise marks selected roles. Interactive teal identifies focus and secondary actions. White form surfaces sit over the pale illustrated canvas; red conveys validation errors.

## Typography
Use the native platform font. Registration heading is 28/800; login tagline 17 with 23 line height; registration subtitle 15/21. Field labels are 15/700, inputs and role labels 14, hints/footer text 12, and primary actions 16/700.

## Layout
One centered scrolling column, maximum width 520 native layout units, with 16-unit horizontal gutters. Content starts at 27.5% of viewport height. Background artwork starts at −10% viewport height and stretches to 110%; bottom padding is max(safe-area inset, 16) + 42. Login sheet padding is 20; registration sheet padding is 16. Keep native scrolling, handled keyboard taps, drag dismissal, and iOS keyboard avoidance.

## Elevation & Depth
Form sheets remain flat. Filled primary actions inherit the native floating shadow: color text, opacity 0.16, radius 16, offset (0, 6), Android elevation 5.

## Shapes
Rounded sheets (login 24, registration 22), fields (12), role options (15), registration badge (14), and secondary action (16). Logo windows are 264×76 for login and 224×64 for registration; existing image offsets crop transparent margins.

## Components
Fields use white fill, a 1-unit border, 22-unit Lucide icons at stroke 1.8, teal focus, and red invalid state. Login fields have minimum height 46; compact registration fields 48. Password visibility buttons have 48×48 minimum targets and accessible state labels. Errors replace hints and announce politely.
Roles remain Estudiante and Personal: login uses two radio options (minimum height 50); registration uses a 48-unit toggle badge. The selected login role carries into registration and changes its identifier label.
Primary actions show an arrow, use 0.85 press opacity, and disable with 0.55 opacity while loading; a spinner replaces the label. Retain existing email/password validation, required registration fields, confirmation matching, and service error handling. Login demo controls remain expandable. Registration retains back and login navigation.

## Do's and Don'ts
- Do reuse `src/assets/NexoU_NewFondo_Login.png`, `NexoU_Fondo_Registro_Estudiante.png`, and `NexoU_Logo.png`; preserve the user's external logo edit.
- Do keep Spanish copy, accessible labels, account roles, keyboard behavior, and existing authentication logic.
- Don't treat this auth scope as a replacement of the repository's other screen designs or introduce web hover behavior into native flows.
