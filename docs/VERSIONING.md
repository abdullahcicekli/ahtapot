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

Every version must have a changelog entry following [Keep a Changelog](https://keepachangelog.com/) format.

### Changelog Categories

```markdown
## [2.1.0] - 2025-10-19

### Added
- New features and capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features marked for removal (deprecate in MINOR, remove in MAJOR)

### Removed
- Features removed (requires MAJOR version bump)

### Fixed
- Bug fixes

### Security
- Security vulnerability patches
```

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

## Release Checklist

Before releasing a new version:

- [ ] Version incremented in `package.json`
- [ ] Version incremented in `src/manifest.json`
- [ ] Changelog updated in README
- [ ] Documentation reflects new version
- [ ] All tests passing
- [ ] Build successful (`npm run build`)
- [ ] Extension tested in Chrome
- [ ] Git tag created: `git tag v2.1.0`
- [ ] Tag pushed: `git push origin v2.1.0`
- [ ] GitHub release created with changelog
- [ ] Chrome Web Store updated (if published)

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

**Last Updated:** 2025-10-21
**Current Version:** 2.3.0
