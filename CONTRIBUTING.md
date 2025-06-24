# Contributing to StealMySample Marketplace

Thank you for your interest in contributing to the StealMySample Marketplace project! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment following the instructions in the README
4. Create a new branch for your feature or fix

## Development Process

### Branching Strategy

We follow a GitFlow-inspired branching strategy:

- `main` - Production code
- `develop` - Development branch with latest features
- `feature/*` - Feature branches (created from and merged back to develop)
- `fix/*` - Bug fix branches (created from and merged back to develop)
- `release/*` - Release preparation branches
- `hotfix/*` - Urgent production fixes (created from main, merged to both main and develop)

### Branch Naming Convention

- Feature branches: `feature/descriptive-feature-name`
- Bug fix branches: `fix/issue-short-description`
- Release branches: `release/vX.Y.Z`
- Hotfix branches: `hotfix/issue-short-description`

Examples:
- `feature/audio-waveform-visualizer`
- `fix/checkout-button-not-working`
- `release/v1.2.0`
- `hotfix/payment-processing-error`

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect the code's meaning (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process, tools, etc.

Scopes:
- `api`
- `ui`
- `auth`
- `audio`
- `checkout`
- `db`
- etc.

Examples:
```
feat(audio): add waveform visualization to audio player
fix(checkout): resolve issue with payment processing
docs(readme): update installation instructions
```

### Pull Request Process

1. Create a new branch from `develop`
2. Make your changes with appropriate commits
3. Push your branch to your fork
4. Submit a pull request to the `develop` branch of the main repository
5. Ensure your PR passes all CI checks
6. Request a review from a maintainer
7. Address any feedback from the reviewer

#### Pull Request Template

When you create a pull request, please include:

- A descriptive title
- A summary of the changes
- Any related issues it addresses
- Screenshots or GIFs for UI changes
- Any notes on testing the changes

### Code Style

- Follow the existing code style in the project
- Use TypeScript for type safety
- Use ESLint and Prettier for code formatting

Run the linters before committing:
```bash
pnpm lint
pnpm format
```

### Testing

- Write tests for new features and bug fixes
- Ensure all existing tests pass
- Test your changes in different browsers if they affect the UI

## Database Changes

When making changes to the database schema:

1. Update the Prisma schema in `prisma/schema.prisma`
2. Run `pnpm prisma generate` to update types
3. For local development, you can use `pnpm prisma db push`
4. For production changes, create migrations:
   ```bash
   pnpm prisma migrate dev --name descriptive-name
   ```

## Working with Next.js App Router

- Put pages in the appropriate directory under `app/`
- Use React Server Components for data-fetching components
- Use Client Components for interactive UI elements
- Follow the patterns established in the project

## Review Process

Pull requests are reviewed by at least one maintainer. The review process checks for:

- Code quality and style
- Test coverage
- Performance considerations
- Security implications
- Compatibility with the project's goals

## Getting Help

If you need help with your contribution, you can:
- Ask questions in the pull request
- Reach out to the maintainers
- Look at similar PRs for guidance

Thank you for contributing to StealMySample Marketplace! 