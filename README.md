# ubiquitous-sniffle

A fresh TypeScript Node.js scaffold.

## Getting started

```bash
npm install
npm run dev          # run the CLI in watch mode
npm run cli          # run the CLI once
npm run build        # compile TypeScript to dist/
npm start            # run the compiled CLI
npm test             # run tests with vitest
npm run typecheck    # type-check without emitting
```

## Project layout

```
src/
  index.ts        # library entry point
  cli.ts          # command-line entry point
  index.test.ts   # sample vitest tests
dist/             # compiled output (git-ignored)
```

## CLI

```
npx ubiquitous-sniffle [name]        # print a greeting
npx ubiquitous-sniffle --help        # show help
npx ubiquitous-sniffle --version     # show version
```

## License

MIT
