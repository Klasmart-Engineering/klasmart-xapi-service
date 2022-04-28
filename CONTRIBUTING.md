# Contributing

## Merge Conventions

Fast forward after rebasing, or squash if your branch has a lot of minor commits that would clutter the commit history.

## Jira Ticket IDs

Include the Jira ticket ID as the _scope_ of the commit message. 

```
feat(DAS-123): my cool feature
```

## Tests

Make an effort to add/update tests when making any code modifications. Use `npm run test:coverage` for a local coverage report to spot uncovered lines/branches.

## Commit Message Format

*This specification is inspired by [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and [Angular](https://github.com/angular/angular/blob/master/CONTRIBUTING.md). Emojis come from [here](https://github.com/pvdlg/conventional-commit-types).*

We have very precise rules over how our Git commit messages must be formatted.
This format leads to **easier to read commit history**.

Refer to [the commitlint rules]( https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md) for `.commitlintrc.json` configuration options.

Each commit message consists of a **header**, a **body**, and a **footer**.

```
<header> (single line)
<BLANK LINE>
<optional body> (any number of lines)
<BLANK LINE>
<optional footer(s)> (any number of lines)
```

A commit that has the text `BREAKING CHANGE: ` at the beginning of its optional body or footer section introduces a breaking API change.

```
feat!: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

The header cannot be longer than 100 characters.

### Commit Message Header

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. First letter not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: Optionally, provides extra context.
  │
  └─⫸ Commit Type: Predefined list of commit categories.
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.

#### Types

| Commit Type | Description                                                                                                 | Emoji  |
| ----------- | ----------------------------------------------------------------------------------------------------------- |:------:|
| `feat`      | A new feature                                                                                               | ✨     |
| `fix`       | A bug Fix                                                                                                   | 🐛     |
| `docs`      | Documentation only changes                                                                                  | 📚     |
| `style`     | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)      | 💎     |
| `refactor`  | A code change that neither fixes a bug nor adds a feature                                                   | 📦     |
| `perf`      | A code change that improves performance                                                                     | 🚀     |
| `test`      | Adding missing tests or correcting existing tests                                                           | 🚨     |
| `build`     | Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)         | 🛠     |
| `ci`        | Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs) | ⚙️     |
| `chore`     | Other changes that don't modify src or test files                                                           | ♻️     |
| `revert`    | Reverts a previous commit                                                                                   | 🗑     |
| `wip`       | Work in progress                                                                                            | 🚧     |

#### Scope

The scope optionally provides extra context. If you're fixing a ListView bug, for example, you might use fix(listview).

#### Summary

Use the summary field to provide a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end


### Commit Message Body

Just as in the summary, use the imperative, present tense: "fix" not "fixed" nor "fixes".

The body can contain information about breaking changes, and is also the place to explain the motivation for the change mentioned in the summary. This commit message should explain _why_ you are making the change.
You can include a comparison of the previous behavior with the new behavior in order to illustrate the impact of the change.
