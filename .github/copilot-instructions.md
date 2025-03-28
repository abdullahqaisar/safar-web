# Copilot Instructions

## Project Guidelines

- **Language**: TypeScript
- **Code Quality**: Ensure all code is clean, modular, and type-safe.
- **Types**: Store all TypeScript types in the `./types` directory.
- **Utilities**: Place reusable utility functions in the `utils/` directory.
- **Routing Algorithm**: The transit routing algorithm is documented in `src/core/Transit Routing Algorithm for Safar Web.md` When ever you are adding a new file or code, add the file name and oneliner detail on this algorithm file too for maintainence.

## Best Practices

- Before starting any new feature, do indepth research and add the details in the `Transit Routing Algorithm for Safar Web.md` file.
- Don't add any new file without adding the onliner details in the `Transit Routing Algorithm for Safar Web.md` file.
- Don't add comments in the code
- Do indepth research before adding any new feature, plan the feature and think of a way to implement it, then implement it in code.
- Follow **single-responsibility principle (SRP)** for functions and modules.
- Use **descriptive variable and function names**.
- Write **reusable and composable** utility functions.
- Ensure **all functions have proper return types**.
- Use **async/await** for handling asynchronous operations.
- Maintain **consistent import structure**
- Keep the **codebase modular** by separating logic into appropriate directories.
- Use libraries like graphology, turf and which ever is necessary for the project.

## Directory Structure

```
/project-root
│── src/
│   ├── core/
│   │   ├── Transit Routing Algorithm for Safar Web.md
│   │   ├──utils/   // For constants and utils
│   │   ├──types/
│   │   ├──graph/
│   │   ├──route/
│   │   ├──data/  // All the station and metro data
```

## Copilot Usage

- **Ensure Type Safety**: Suggest type-safe implementations using TypeScript.
- **Follow Project Structure**: Adhere to the established directory structure.
- **Keep Code Clean**: Generate modular and reusable functions.
- **Optimize for Performance**: Suggest the most efficient algorithms and data structures where applicable.

---

By following these guidelines, Copilot will assist in generating high-quality, maintainable TypeScript code for the project.
