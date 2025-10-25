# Versioning Strategy

Ahtapot follows [Semantic Versioning 2.0.0](https://semver.org/) (SemVer) for predictable and meaningful version numbers.

## Version Format

```
MAJOR.MINOR.PATCH
```

**Example:** `2.1.3`
- **2** = Major version
- **1** = Minor version
- **3** = Patch version

---

## Version Increment Rules

### 🔴 MAJOR Version (X.0.0)

Increment when making **backward-incompatible changes** that break existing functionality.

**Examples:**
- Removing support for a threat intelligence provider (e.g., removing VirusTotal)
- Changing API response structure in breaking ways
- Removing or renaming public APIs
- Major architectural changes requiring user migration
- Changing storage format incompatibly

**Impact:** Users may need to reconfigure or adapt their workflows

**Migration:** Always provide migration guide in release notes

---

### 🟡 MINOR Version (x.Y.0)

Increment when adding **new features** in a backward-compatible manner.

**Examples:**
- Adding a new threat intelligence provider (e.g., AbuseIPDB, MalwareBazaar)
- Adding new IOC detection types (e.g., cryptocurrency addresses)
- Implementing new UI components or pages
- Adding new API endpoints or optional parameters
- Performance improvements without breaking changes
- New language support (i18n)

**Impact:** Users get new functionality without breaking existing features

**Note:** Reset PATCH version to 0 when incrementing MINOR

---

### 🟢 PATCH Version (x.y.Z)

Increment for **bug fixes** and minor improvements that don't add features.

**Examples:**
- Fixing IOC detection regex bugs
- Correcting API rate limit handling
- UI styling fixes
- Typo corrections in UI text
- Security patches
- Performance optimizations
- Documentation updates

**Impact:** Users get fixes without workflow changes

---

## Special Cases

### Pre-release Versions

Use for testing and development:

```
2.1.0-alpha.1    # Early testing, unstable
2.1.0-beta.1     # Feature complete, testing phase
2.1.0-rc.1       # Release candidate, final testing
```

**Format:** `X.Y.Z-<label>.<number>`

### Development Versions

Use for local development:

```
2.1.0-dev
2.1.0-dev.20251019
```

---

## Version Lifecycle

### 1. Planning Phase
```
Current: 2.0.0
Planning: 2.1.0-dev
```

### 2. Development Phase
```
Feature branch: feature/malwarebazaar-integration
Development version: 2.1.0-dev
```

### 3. Testing Phase
```
2.1.0-alpha.1  → Internal testing
2.1.0-beta.1   → Public beta testing
2.1.0-rc.1     → Release candidate
```

### 4. Release Phase
```
2.1.0 → Official release
```

### 5. Maintenance Phase
```
2.1.1 → Bug fixes
2.1.2 → More fixes
```

---

## Decision Matrix

Use this matrix to determine version increment:

| Change Type | Breaking Change? | New Feature? | Bug Fix? | Version |
|-------------|------------------|--------------|----------|---------|
| Remove provider | ✅ Yes | ❌ No | ❌ No | MAJOR |
| Change API structure | ✅ Yes | ❌ No | ❌ No | MAJOR |
| Add new provider | ❌ No | ✅ Yes | ❌ No | MINOR |
| Add IOC type | ❌ No | ✅ Yes | ❌ No | MINOR |
| Fix detection bug | ❌ No | ❌ No | ✅ Yes | PATCH |
| Fix UI styling | ❌ No | ❌ No | ✅ Yes | PATCH |
| Security patch | ❌ No | ❌ No | ✅ Yes | PATCH |
| Documentation update | ❌ No | ❌ No | ✅ Yes | PATCH |

---

## Changelog Requirements

Every version must have changelog entries in **BOTH** `CHANGELOG.md` and `README.md` following [Keep a Changelog](https://keepachangelog.com/) format.

### Documentation Update Rules

When releasing a new version, you MUST update these files in order:

#### 1. CHANGELOG.md (Complete Version History)
- **Location:** `/CHANGELOG.md` (project root)
- **Format:** Keep a Changelog standard
- **Content:** ALL versions with complete details
- **Order:** Newest version at the TOP (reverse chronological)
- **Purpose:** Comprehensive historical record

**Update Process:**
1. Add new version entry at the TOP of the changelog (after `## [Unreleased]`)
2. Use format: `## [X.Y.Z] - YYYY-MM-DD`
3. Include all changes in appropriate categories
4. Keep all previous versions below

#### 2. README.md (Latest Version Only)
- **Location:** `/README.md` (project root)
- **Section:** `## 🆕 What's New in vX.Y.Z`
- **Content:** ONLY the latest version (concise bullet points)
- **Link:** Must include link to CHANGELOG.md for full history
- **Purpose:** Quick overview for new users

**Update Process:**
1. Replace entire "What's New" section with latest version
2. Use concise bullet points (5-7 items max)
3. Focus on user-facing changes
4. Add link: `📜 **[View Complete Changelog](CHANGELOG.md)**`

### Changelog Categories

Use these categories in order (include only if applicable):

```markdown
## [2.1.0] - 2025-10-19

### Added
- New features and capabilities
- New integrations or providers
- New UI components

### Changed
- Changes to existing functionality
- Improvements to existing features
- Updated dependencies

### Deprecated
- Features marked for removal (deprecate in MINOR, remove in MAJOR)

### Removed
- Features removed (requires MAJOR version bump)

### Fixed
- Bug fixes
- UI/UX corrections
- Performance fixes

### Security
- Security vulnerability patches
- Security improvements
```

### CHANGELOG.md Best Practices

#### Structure
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Features in development but not yet released

## [2.3.1] - 2025-10-25  ← NEWEST AT TOP
### Added
- ...

## [2.3.0] - 2025-10-21  ← OLDER VERSIONS BELOW
### Added
- ...
```

#### Writing Guidelines
- **Be Specific:** "Added GreyNoise integration" not "Added new feature"
- **User-Focused:** Describe impact, not implementation details
- **Grouping:** Group related changes under same category
- **Links:** Include links to issues, PRs, or documentation when relevant
- **Breaking Changes:** Clearly mark with ⚠️ or **BREAKING** prefix

#### Example Entry
```markdown
## [2.3.0] - 2025-10-21

### Added
- **GreyNoise Integration** - Internet-wide noise detection and threat classification
- Rate limit protection system with user confirmation prompts
- Smart provider confirmations for GreyNoise (50 searches/week) and Shodan (100 results/month)

### Changed
- Complete i18n localization for new features in English and Turkish
- Enhanced provider management with quota protection

### Fixed
- API rate limit handling for time-based quotas
- Provider card rendering in dark mode
```

### README.md Update Template

When updating README for new version:

```markdown
## 🆕 What's New in vX.Y.Z

### Latest Release (Month Day, Year)
- 🎯 **Feature Name** - Brief description (5-10 words)
- 🔧 **Improvement** - What was improved
- 🐛 **Bug Fix** - What was fixed

### Active Threat Intelligence Providers
- ✅ **Provider1** • **Provider2** • **Provider3** ...
- 🎯 **Key Feature** - Brief description
- ⚠️ **Important Note** - Critical information

📜 **[View Complete Changelog](CHANGELOG.md)** - Full version history and detailed release notes
```

**Important:** Remove all previous version details from README - keep ONLY latest version.

---

## Best Practices for Contributors

### Before Making Changes

1. **Identify change type:** Feature, fix, or breaking change?
2. **Check current version:** Read `package.json` version
3. **Plan version increment:** Use decision matrix above
4. **Create feature branch:** `feature/descriptive-name` or `fix/bug-description`

### During Development

1. **Update version:** Increment version in `package.json` and `src/manifest.json`
2. **Write changelog:** Add entry to changelog section in README or CHANGELOG.md
3. **Update documentation:** Reflect changes in README
4. **Test thoroughly:** Ensure backward compatibility for MINOR/PATCH

### Creating Pull Requests

Include in PR description:
- **Change type:** MAJOR/MINOR/PATCH
- **Version bump:** Old version → New version
- **Changelog entry:** What changed and why
- **Breaking changes:** Migration guide if MAJOR
- **Testing done:** How you verified the changes

### Example PR Title Format

```
feat: Add MalwareBazaar integration (v2.1.0)
fix: Correct IPv6 detection regex (v2.0.1)
breaking: Remove Shodan provider (v3.0.0)
```

---

## API Stability Promise

### What We Guarantee

- **PATCH versions:** Always safe to update, no breaking changes
- **MINOR versions:** New features, backward compatible, safe to update
- **MAJOR versions:** May require configuration changes, read migration guide

### Deprecation Policy

1. **Announce deprecation** in MINOR version with warnings
2. **Maintain functionality** for at least one MINOR version
3. **Remove deprecated features** only in MAJOR version

**Example:**
```
v2.1.0: Deprecate Shodan (add warnings)
v2.2.0: Still functional but deprecated
v3.0.0: Shodan removed (breaking change)
```

---

## Version History Examples

### Current Project Evolution

```
1.0.0 → Initial release (VirusTotal only)
2.0.0 → Major rewrite (OTX integration, tab UI, i18n)
2.1.0 → New providers (AbuseIPDB, MalwareBazaar)
2.1.1 → Bug fixes (detection regex, UI styling)
2.2.0 → New IOC types (Bitcoin, Ethereum)
3.0.0 → Breaking change (remove deprecated providers)
```

---

## Automation & Tools

### Recommended Tools

- **semantic-release:** Automate version bumping based on commit messages
- **conventional-commits:** Standardize commit message format
- **changelog:** Auto-generate changelog from commits

### Commit Message Convention

Following [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add MalwareBazaar integration       → MINOR bump
fix: Correct IPv6 detection regex         → PATCH bump
fix!: Change API response structure       → MAJOR bump (note the !)
docs: Update README with new examples     → PATCH bump
```

---

## Version Synchronization

**CRITICAL:** All version numbers must be synchronized across the following locations:

### Required Version Updates
Every version change MUST update these files:

1. **`package.json`** → `version` field
2. **`src/manifest.json`** → `version` field
3. **`docs/VERSIONING.md`** → `Current Version` at bottom of file

### Automatic Version Display
The extension automatically displays the version from `manifest.json` in:
- **Popup footer**: Shows `v{version}` from `chrome.runtime.getManifest().version`
- No manual UI updates needed - version is read dynamically

### Validation
Before committing version changes:
```bash
# Verify all versions match
grep '"version"' package.json src/manifest.json
grep 'Current Version:' docs/VERSIONING.md
```

All three outputs should show the same version number.

---

## Release Checklist

Before releasing a new version, complete ALL items in order:

### 1. Version Number Updates
- [ ] Version incremented in `package.json`
- [ ] Version incremented in `src/manifest.json`
- [ ] Version updated in `docs/VERSIONING.md` (Current Version section at bottom)
- [ ] Verify all three versions match using grep command:
  ```bash
  grep '"version"' package.json src/manifest.json && grep 'Current Version:' docs/VERSIONING.md
  ```

### 2. Documentation Updates (CRITICAL)
- [ ] **CHANGELOG.md** - Add new version at TOP (after `## [Unreleased]`)
  - Use format: `## [X.Y.Z] - YYYY-MM-DD`
  - Include all changes with proper categories (Added, Changed, Fixed, etc.)
  - Keep all previous versions below
- [ ] **README.md** - Replace "What's New" section with latest version ONLY
  - Remove all old version details
  - Keep only new version (5-7 concise bullet points)
  - Include link to CHANGELOG.md
  - Update "Current Version" at bottom
- [ ] Verify CHANGELOG link works in README

### 3. Code Quality & Testing
- [ ] All tests passing
- [ ] Build successful (`npm run build`)
- [ ] Extension tested in Chrome
- [ ] Verify version displays correctly in popup footer (dynamic from manifest.json)
- [ ] Test all new features introduced in this version
- [ ] Verify i18n translations for new features (EN & TR)

### 4. Git & Release
- [ ] All changes committed with descriptive messages
- [ ] Git tag created: `git tag vX.Y.Z`
- [ ] Tag pushed: `git push origin vX.Y.Z`
- [ ] GitHub release created with changelog content
- [ ] Chrome Web Store updated (if published)

### 5. Post-Release Verification
- [ ] Verify GitHub release displays correctly
- [ ] Check Chrome Web Store listing (if applicable)
- [ ] Confirm CHANGELOG.md renders properly on GitHub
- [ ] Test fresh installation from store/release

### Example Release Workflow

```bash
# 1. Update version numbers
# Edit: package.json, src/manifest.json, docs/VERSIONING.md

# 2. Verify version sync
grep '"version"' package.json src/manifest.json && grep 'Current Version:' docs/VERSIONING.md

# 3. Update documentation
# Edit: CHANGELOG.md (add new version at top)
# Edit: README.md (replace "What's New" section)

# 4. Build and test
npm run build
# Test extension in Chrome

# 5. Commit and tag
git add .
git commit -m "chore: Release v2.3.1

- Updated version to 2.3.1 across all files
- Added CHANGELOG entry for v2.3.1
- Updated README with latest release notes"

git tag v2.3.1
git push origin master
git push origin v2.3.1

# 6. Create GitHub release with CHANGELOG content
```

---

## Questions?

If unsure about version increment:

1. **Ask yourself:** "Will this break existing users?"
   - Yes → MAJOR
   - No → Continue

2. **Ask yourself:** "Am I adding new functionality?"
   - Yes → MINOR
   - No → PATCH

3. **When in doubt:** Ask maintainers in the pull request

---

## Resources

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [SemVer Calculator](https://semver.npmjs.com/)

---

**Last Updated:** 2025-10-25
**Current Version:** 2.3.2