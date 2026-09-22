# Security

This repo contains a method, documentation, and an in-memory example. It
runs nothing as a service and has no runtime dependencies; dev dependencies
are `typescript`, `eslint`, `typescript-eslint`, `vitest`, `@types/node`.

The one thing worth reporting: a way to cross the example's boundaries that
`scripts/prove-gates-fail.sh` does not catch. That is a bug in the gates and
therefore in the method. Open an issue with the patch, or, if you would
rather not post it publicly, email the address on the repository owner's
GitHub profile.

Dependency advisories: run `npm audit` in `examples/product-catalog/`;
patches welcome.
