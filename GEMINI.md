# Project Overview

This is a Next.js application that provides a "Shadowing" experience for language learners. Users can upload audio files, which are then transcribed using Groq's Whisper-large-v3 model. The transcriptions are further processed by OpenRouter to normalize sentences, add language annotations, and provide translations. The application's frontend allows users to view the subtitles in sync with the audio and loop sentences for practice. All user data is stored locally in the browser using IndexedDB.

## Building and Running

### Prerequisites

- Node.js
- pnpm

### Installation

1.  Install the dependencies:
    ```bash
    pnpm install
    ```

### Running the Development Server

1.  Start the development server:
    ```bash
    pnpm dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

1.  Build the application:
    ```bash
    pnpm build
    ```

### Running in Production

1.  Start the production server:
    ```bash
    pnpm start
    ```

### Testing

1.  Run the tests:
    ```bash
    pnpm test
    ```

## Development Conventions

### Coding Style

The project uses ESLint to enforce a consistent coding style. You can run the linter with the following command:

```bash
pnpm lint
```

### Type Checking

The project uses TypeScript for static type checking. You can run the type checker with the following command:

```bash
pnpm type-check
```

### Testing

The project uses Jest for testing. The test files are located in the `src/__tests__` directory. You can run the tests with the following command:

```bash
pnpm test
```
