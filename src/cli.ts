#!/usr/bin/env node
import { greet, VERSION } from "./index.js";

function main(argv: string[]): number {
  const args = argv.slice(2);

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`ubiquitous-sniffle v${VERSION}`);
    return 0;
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`ubiquitous-sniffle v${VERSION}

Usage:
  ubiquitous-sniffle [name]
  ubiquitous-sniffle --help | -h
  ubiquitous-sniffle --version | -v

Options:
  -h, --help     Show this help message
  -v, --version  Show version number
`);
    return 0;
  }

  const name = args.find((a) => !a.startsWith("-"));
  const { message } = greet(name);
  console.log(message);
  return 0;
}

process.exit(main(process.argv));
