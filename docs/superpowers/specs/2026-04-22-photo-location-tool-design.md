# Photo Location Tool Design

Date: 2026-04-22
Status: Draft approved for planning

## Summary

Build a front-end / back-end separated photo location lookup service.

The product accepts an uploaded photo or camera capture, then determines where the photo was taken using the following priority:

1. Use EXIF/GPS metadata when available.
2. Fall back to AI visual inference when GPS metadata is missing.
3. If the image lacks enough evidence, return an explicit "unable to determine" result instead of guessing aggressively.

The first version should feel like a polished tool website rather than a rough demo, while keeping the implementation lean and infra-aligned with real cloud concepts.

## Product Goals

- Let a user upload a photo or take one directly in the browser.
- Show a trustworthy result with clear confidence boundaries.
- Prefer real metadata over AI guesses.
- Preserve short-term history without requiring login.
- Keep infrastructure simple enough for local-first development and Railway deployment.

## Non-Goals

- User accounts and cross-device sync
- SSR
- Background job / queue system in V1
- Long-term original photo storage
- Self-hosted vision models or custom CV pipelines
- Google Maps embed or paid map SDK integration in V1

## Tech Stack

### Frontend

- Vue 3
- Vite SPA
- TypeScript
- Vue Router
- Pinia
- Leaflet for in-app map rendering

### Backend

- TypeScript
- REST API
- EXIF/GPS extraction
- Thumbnail generation
- Gemini integration behind a thin provider wrapper

### Infrastructure

- Railway for deployment
- Railway Postgres for structured data
- Railway Bucket for thumbnail storage
- Local-first development, Railway as V1 deployment target

### Engineering Standards

- Linting and project quality conventions should follow the existing `eat-sky` frontend baseline where applicable.
- Use `@antfu/eslint-config` style strictness, including strong TypeScript rules.
- Use the superpowers workflow: brainstorming -> design -> planning -> implementation.

## User Experience

### Primary Flows

1. Upload a single image.
2. Take a photo directly from the browser camera.
3. See analysis progress.
4. View the result card, map state, and explanation.
5. Review recent history.

### Result Modes

#### Precise

Used when:

- Valid EXIF/GPS is present, or
- AI can support a specific point with enough confidence

Presentation:

- Map pin shown
- Main result label
- Confidence score
- Link to open in Google Maps

#### Approximate

Used when AI can infer only an area-level answer such as city, district, or broad landmark region.

Presentation:

- Approximate label shown explicitly
- Map centers on an approximate point only
- UI must not imply exact precision

#### Not Found

Used when:

- The subject is too close
- The image lacks identifiable location cues
- The image is too ambiguous, blurry, or visually weak

Presentation:

- No fake precision
- Clear "unable to determine" explanation

## System Architecture

```text
Vue SPA
  -> Backend REST API
      -> Postgres
      -> Railway Bucket
      -> Gemini provider
```

Railway project layout:

- Frontend service
- Backend service
- Postgres
- Bucket

The system stays synchronous in V1, but backend boundaries should leave room for future async job processing if analysis latency grows.

## Frontend Design

### Modules

- `app-shell`: layout, routing container, global notifications
- `capture-upload`: file selection, camera capture, local preview
- `analysis-flow`: submit analysis request, show loading and errors
- `result-view`: main answer, top 3 candidates, explanation, confidence
- `map-view`: Leaflet map, precise or approximate marker state, Google Maps link
- `history-view`: recent analysis list and detail recall

### Frontend Structure Direction

Prefer feature-oriented organization:

- `views/`
- `features/upload/`
- `features/analysis/`
- `features/results/`
- `features/history/`
- `features/map/`
- `shared/`

## Backend Design

### Modules

- `http layer`: request validation, response formatting, error mapping
- `visitor service`: anonymous visitor token issuance and resolution
- `rate limit service`: visitor token + IP based enforcement
- `photo intake service`: file validation, metadata extraction, thumbnail generation
- `location analysis service`: decide GPS path vs AI path, normalize final result
- `ai provider layer`: provider interface plus Gemini implementation
- `history service`: create and list searches
- `cleanup job`: remove expired data and orphaned assets

### Provider Boundary

Use a thin interface such as:

```ts
interface VisionLocationProvider {
  inferLocation(input: PhotoAnalysisInput): Promise<LocationInferenceResult>
}
```

V1 should implement only one provider:

- `GeminiVisionLocationProvider`

This keeps V1 simple while preserving the option to add another provider later.

## Data Flow

```text
Upload photo
  -> validate file
  -> extract EXIF/GPS
  -> if GPS exists: return precise result
  -> else: call Gemini visual inference
  -> normalize result
  -> classify as precise / approximate / not_found
  -> generate thumbnail
  -> persist history
  -> return response
```

### Decision Rules

1. EXIF/GPS always has priority over AI.
2. AI must not fabricate exact precision.
3. "Unable to determine" is a valid product outcome, not an error.
4. Top 3 candidates are only meaningful for AI-based results.

### Result Shape

Core response fields should support:

- `result_type`: `precise | approximate | not_found`
- `primary_result`
- `candidates[]`
- `source`: `exif | ai`

Recommended `primary_result` content:

- label
- latitude / longitude when justified
- confidence
- reason summary
- source

Recommended candidate content:

- label
- optional latitude / longitude
- confidence
- clue list

## Maps Strategy

### In-App Map

- Use Leaflet for map rendering.
- Keep tile provider swappable.
- Start with a low-cost OSM-based approach for V1.

### External Navigation

- Provide a button that opens Google Maps via URL.
- Do not embed Google Maps SDK in V1.

### Precision Policy

- Prefer exact pins only when truly justified.
- Fall back to area-level display when only approximate inference is available.
- Show no misleading pin when the result is not trustworthy.

## Anonymous History Model

### Visitor Identity

- On first visit, backend issues an anonymous visitor token.
- Browser stores the token.
- Backend treats the token as the history and rate-limit anchor.

### History Retention

- Keep up to 10 searches per visitor token.
- When an 11th search is saved, remove the oldest saved search for that token.
- Apply a maximum retention window of 180 days.

### Storage Rules

- Do not persist the original photo.
- Persist only:
  - thumbnail
  - result data
  - candidate data
  - minimal visitor linkage

## Rate Limiting

Use a two-layer approach:

1. Anonymous visitor token limit
2. IP-based limit

Either limit may block a request.

The system should support user-facing states such as:

- allowed
- warning-near-limit
- blocked

Frontend history must not be treated as a security boundary.

## Data Storage

### Postgres

Suggested conceptual tables:

- `visitors`
- `searches`
- `search_results`
- `candidate_locations`
- `rate_limit_events` or equivalent aggregated tracking

### Railway Bucket

- Store thumbnails only
- No original photo persistence in V1

## Cleanup Strategy

Use a periodic cleanup job, not request-path cleanup.

Cleanup responsibilities:

- remove expired thumbnails
- remove expired search history beyond 180 days
- enforce per-visitor max-10 history invariant
- remove orphaned storage objects if any exist

## Error Handling

Expected user-facing outcomes:

- invalid file
- unsupported media type
- file too large
- rate limited
- analysis failed
- unable to determine location

Important distinction:

- "Unable to determine location" is a valid result state.
- "Analysis failed" is a technical failure state.

## Testing Strategy

### Required Quality Gates

- lint
- typecheck
- frontend unit tests
- backend unit tests

### High-Value Test Areas

- valid upload vs invalid upload
- EXIF/GPS happy path
- malformed GPS metadata handling
- AI response normalization
- AI precise vs approximate vs not_found classification
- malformed AI output fallback behavior
- history retention max 10 items
- 180-day cleanup behavior
- rate-limit behavior for visitor token and IP

## Delivery Approach

Recommended implementation shape for V1:

- synchronous request flow
- clean service boundaries
- no queue yet
- abstractions only where they reduce future rewrite risk

This is the recommended "approach B" outcome:

- simple enough to ship quickly
- structured enough to evolve into async workers, auth, or multiple AI providers later

## Open Questions Resolved

- Frontend should use Vue, not SSR.
- V1 deployment target is Railway.
- AI provider in V1 is Gemini.
- Gemini credentials should come from Google AI Studio for initial development.
- In-app maps should prioritize low cost, while external open-in-Google-Maps links remain available.

## Planning Readiness

This design is intentionally scoped so the next step can be a concrete implementation plan covering:

- project scaffolding
- frontend architecture
- backend API design
- DB schema
- storage integration
- Gemini integration
- cleanup job
- tests and deployment
