# STANDARDS.md

# Engineering Standards

Version: 1.0

Status: Active

This document defines the engineering standards for Mission Control.

Every implementation must follow these standards.

If this document conflicts with personal preference, this document wins.

---

# Core Philosophy

We optimize for:

1. Simplicity
2. Maintainability
3. Performance
4. Readability
5. Developer Experience

Every decision should improve at least one of these without significantly hurting another.

The simplest correct solution is usually the best solution.

---

# Definition of Quality

Code is considered production-ready only if it is:

- readable
- maintainable
- strongly typed
- performant
- testable
- consistent
- documented where necessary

Working code alone is not sufficient.

---

# General Rules

Prefer deletion over addition.

Prefer composition over inheritance.

Prefer explicit code over clever code.

Prefer immutable data.

Prefer pure functions.

Avoid unnecessary abstraction.

Avoid premature optimization.

Avoid unnecessary configuration.

Avoid magic.

If something feels clever, it is probably wrong.

---

# Simplicity Rules

Always implement the simplest solution that satisfies current requirements.

Never build for hypothetical future features.

Do not introduce generic abstractions until at least three real implementations require them.

Avoid factories, builders, dependency injection containers, and complex patterns unless there is a demonstrated need.

---

# File Organization

Every file should have one clear responsibility.

Target sizes:

Functions

< 50 lines

React Components

< 300 lines

Rust Modules

< 300 lines

If a file becomes difficult to understand, split it.

---

# Naming

Names should describe intent.

Prefer:

TaskTimeline

FloatingWidget

NotificationStore

Avoid:

Helper

Utils

Manager2

Temp

Data

Stuff

Variables should read like English.

---

# TypeScript

Strict mode enabled.

Never use:

any

Prefer:

unknown

or proper types.

Prefer interfaces for public contracts.

Prefer type aliases for unions.

Avoid enums unless required.

Use discriminated unions.

No implicit any.

No ignored type errors.

---

# Rust

Use idiomatic Rust.

Prefer Result over panic.

Avoid unwrap() outside tests.

Use modules with clear ownership.

Prefer explicit error types.

Avoid global mutable state.

---

# React

Prefer functional components.

Use hooks.

Avoid unnecessary memoization.

Only optimize when profiling demonstrates a bottleneck.

Keep component state local.

Lift state only when necessary.

---

# State Management

Global state belongs in Zustand.

Component state belongs inside components.

Never duplicate the same state in multiple places.

State should have one owner.

---

# Styling

Tailwind only.

Avoid custom CSS files.

Animations through Framer Motion.

Spacing should remain consistent.

Use design tokens.

---

# Animations

Animations communicate state.

Never animate for decoration.

Animation targets:

150–250 ms

Use easing.

Never block interaction.

---

# Dependencies

Every dependency increases maintenance cost.

Before adding a dependency ask:

Can this be solved with existing code?

Can this be solved with the platform?

Can this be solved with fewer dependencies?

Only add dependencies with clear long-term value.

---

# Performance

Performance is a feature.

Targets:

Cold startup

< 2 s

Idle RAM

< 70 MB

Busy RAM

< 120 MB

60 FPS UI

Avoid unnecessary re-renders.

Avoid polling.

Prefer event-driven architecture.

Lazy-load only when beneficial.

---

# Error Handling

Errors should be actionable.

Error messages should explain:

What failed.

Why.

How to recover.

Never swallow errors.

Never expose internal implementation details to users.

---

# Logging

Development logs should help debugging.

Production logs should help diagnosis.

No console.log in production.

Use structured logging.

---

# Database

Keep schema simple.

Normalize where practical.

Avoid premature optimization.

Repositories should remain thin.

Business logic never belongs in SQL.

---

# Security

Never store secrets in source code.

Never commit credentials.

Validate external input.

Escape user-generated content.

Store sensitive credentials using platform secure storage.

---

# Accessibility

Keyboard first.

Visible focus states.

Semantic HTML.

Animations should respect reduced motion preferences.

High contrast should remain usable.

---

# Testing Philosophy

Test behavior.

Do not test implementation details.

Prefer integration tests over excessive mocks.

Core business logic should be well tested.

UI testing should focus on user interaction.

---

# Documentation

Code should usually explain itself.

Document:

why

not

what

Architecture changes require documentation updates.

---

# Refactoring

Always leave the codebase cleaner.

Small continuous improvements are preferred over massive rewrites.

Never rewrite working systems without measurable benefit.

---

# Pull Request Checklist

Before considering work complete verify:

- Build passes.
- Types pass.
- Lint passes.
- Tests pass.
- No duplicated code.
- No dead code.
- No TODO comments.
- Documentation updated.
- PROJECT_STATE updated.

---

# AI Development Rules

Before writing code:

Read:

README.md

PRODUCT.md

ARCHITECTURE.md

PROJECT_STATE.md

Identify current milestone.

Create a short implementation plan.

Only then begin coding.

---

During implementation:

Reuse existing abstractions.

Do not introduce unnecessary architecture.

Keep changes minimal.

Update related documentation.

---

After implementation:

Verify build.

Verify types.

Verify lint.

Update PROJECT_STATE.

Recommend the single highest priority next task.

Never finish a session without leaving the project in a working state.

---

# Manual Steps

If implementation requires developer action:

Do not stop with a vague instruction.

Instead provide:

Purpose

Exact steps

Expected result

How implementation continues afterwards

The goal is to minimize manual work for the developer.

---

# Success Metric

A senior engineer reviewing the code should conclude:

- Architecture is coherent.
- Code is easy to understand.
- No obvious optimization opportunities exist.
- Dependencies are justified.
- Performance is excellent.
- The implementation feels intentional rather than AI-generated.
