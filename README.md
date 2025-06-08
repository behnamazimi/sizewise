# 🚦 SizeWise

A CLI tool that helps you measure and report the size of pull requests or merge requests.

SizeWise analyzes your PRs or MRs and gives quick feedback on their size. Giving you clear metrics so your team can stay aware.

---

## ⚡ Quick Start

```bash
# 1. Set up configuration
npx sizewise init
```
The wizard walks you through size thresholds and preferences. After that, just run npx sizewise on any PR.


```bash
# 2. Run analysis
npx sizewise
```

---

## 🔑 Features

- Supports **GitHub** & **GitLab**
- Tracks files, lines, and directories changed
- Custom **size thresholds**
- Fully **CI/CD friendly**
- Adds **labels** and **comments** automatically
- Built in **TypeScript**

---

🛠 Usage Examples

```bash
# Minimal Example (Assumes required environment variables are set)
npx sizewise --pr-id 123

# With Arguments (Overrides env vars)
npx sizewise \
  --platform github \
  --pr-id 456 \
  --host https://github.company.com \
  --token $GITHUB_TOKEN \
  --project-id myorg/myrepo
```

## Environment Variables:

SizeWise automatically looks for default environment variables to detect the platform (GitHub or GitLab).

**For GitLab:**
- `GITLAB_TOKEN` or `CI_JOB_TOKEN` - for access
- `GITLAB_HOST` or `CI_SERVER_URL` - GitLab URL
- `CI_PROJECT_ID` - project ID
- `CI_MERGE_REQUEST_IID` - merge request ID

**For GitHub:**
- `GITHUB_TOKEN` - for access
- `GITHUB_SERVER_URL` - GitHub URL
- `GITHUB_REPOSITORY` - in `owner/repo` format
- `GITHUB_EVENT_NUMBER` or `PR_NUMBER` - pull request number


## ⚙️ Common CLI Options

You can also use CLI arguments to configure the analysis. These arguments will override the default environment variables.

| Option               | Description                                    |
|----------------------|------------------------------------------------|
| `--pr-id`, `--mr-id` | Pull/Merge request ID                          |
| `--project-id`       | GitHub: `owner/repo` • GitLab: numeric ID     |
| `--token`            | API token (overrides env vars)                |
| `--host`             | Custom platform URL                           |
| `--platform`         | Force platform (`github`, `gitlab`)           |
| `-c`, `--config`     | Custom config file path                       |
| `-v`, `--verbose`    | Show detailed output                          |
| `-j`, `--json`       | Output in JSON format                         |
| `--no-exit-code`     | Don't fail CI on large PRs                    |

---

## 🔄 CI Integration

### GitHub Actions

```yaml
name: PR Size Check
on: [pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR Size
        run: npx sizewise
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI

```yaml
analyze_pr_size:
  image: node:18
  script:
    - npx sizewise
  rules:
    - if: $CI_MERGE_REQUEST_IID
```

---

## 🧹 Configuration

Start with the wizard:

```bash
npx sizewise init
```

Or create a manual config file at `.github/sizewise.config.json` or `.gitlab/sizewise.config.json`:

```json
{
  "thresholds": {
    "small": { "files": 5, "lines": 50, "directories": 2 },
    "medium": { "files": 10, "lines": 200, "directories": 4 },
    "large": { "files": 20, "lines": 500, "directories": 8 }
  },
  "excludePatterns": [
    "**/*.lock", "**/dist/**", "**/node_modules/**", "**/coverage/**"
  ],
  "comment": {
    "enabled": true,
    "template": "🔍 **Pull Request Size:** {size}",
    "updateExisting": true
  },
  "label": {
    "enabled": true,
    "prefix": "size:"
  },
  "logging": { "verbose": true }
}
```
