# 🚦 SizeWise

SizeWise is a CLI tool that measures and reports the size of your pull requests (or merge requests on Gitlab).

It quickly analyzes your PRs and gives you clear, simple feedback, so your team can easily see how big the changes are and stay on the same page.

SizeWise uses [@octokit/rest](https://www.npmjs.com/package/@octokit/rest) Github and [@gitbeaker/rest](https://www.npmjs.com/package/@gitbeaker/rest) Gitlab REST API clients to fetch data.

---

## ⚡ Quick Start

1. **Initialize Configuration**
```bash
npx sizewise init
```
This will create a config file with your preferred settings through an interactive wizard.

2. **Analyze Your PR/MR**

With environment variables:
```bash
# If you have GITHUB_TOKEN/GITLAB_TOKEN and other env vars set
npx sizewise --pr-id 123
```

Without environment variables:
```bash
# Provide all required arguments manually
npx sizewise \
  --platform github \
  --host https://github.company.com \
  --token $GITHUB_TOKEN \
  --project-id myorg/myrepo \
  --pr-id 456
```

---

## Features

- Supports **GitHub** & **GitLab**
- **File changes**, **line changes**, and **impacted directories** analysis
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

## Required Configuration

You can configure SizeWise either through environment variables or CLI options. You need to provide:
1. Platform information (GitHub/GitLab)
2. Authentication
3. Project identification
4. Pull/Merge request ID

### Environment Variables

**GitHub:**
```bash
# Required for GitHub
GITHUB_TOKEN=your_token                # Authentication, with proper permissions
GITHUB_SERVER_URL=https://github.com   # Your GitHub URL
GITHUB_REPOSITORY=owner/repo           # Repository in owner/repo format
GITHUB_EVENT_NUMBER=123                # PR number (or use --pr-id)
```

**GitLab:**
```bash
# Required for GitLab
GITLAB_TOKEN=your_token                # Authentication (or CI_JOB_TOKEN), with proper permissions
GITLAB_HOST=https://gitlab.com         # Your GitLab URL (or CI_SERVER_URL)
CI_PROJECT_ID=123                      # Project ID
CI_MERGE_REQUEST_IID=456               # MR ID (or use --pr-id)
```

### ⚙️ CLI Options

**Required (if not using env vars):**
| Option               | Description                                    | Default               |
|---------------------|------------------------------------------------|----------------------|
| `--pr-id`, `--mr-id` | Pull/Merge request ID to analyze               | From env vars        |
| `--platform`         | Platform to use (`github`, `gitlab`)           | Auto-detected        |
| `--token`            | API token for authentication                   | From env vars        |
| `--host`             | Platform URL (e.g. https://github.com)         | From env vars        |
| `--project-id`       | GitHub: `owner/repo` • GitLab: numeric ID     | From env vars        |

**Optional:**
| Option              | Description                                    | Default               |
|---------------------|------------------------------------------------|----------------------|
| `-c`, `--config`    | Custom config file path                        | Auto-detected        |
| `-v`, `--verbose`   | Show detailed output                           | `false`              |
| `-j`, `--json`      | Output in JSON format                          | `false`              |
| `--no-exit-code`    | Don't fail CI on large PRs                     | `false`              |

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
