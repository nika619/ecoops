"""
Push the wasteful CI config to GitLab and verify ECOOPS detects it.
This script:
1. Reads the wasteful demo CI config
2. Pushes it to the GitLab project (replacing the current .gitlab-ci.yml)
3. Prints confirmation
"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

# Fix Windows cp1252 encoding for emoji output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv()

from gitlab_client import GitLabClient

TOKEN = os.getenv("GITLAB_TOKEN")
PROJECT_ID = os.getenv("GITLAB_PROJECT_ID", "80426748")
BASE_URL = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")

if not TOKEN:
    print("❌ GITLAB_TOKEN not set")
    sys.exit(1)

gitlab = GitLabClient(TOKEN, PROJECT_ID, BASE_URL)

# Read the wasteful CI file
wasteful_path = os.path.join(os.path.dirname(__file__), "demo", "wasteful-ci.yml")
with open(wasteful_path, "r", encoding="utf-8") as f:
    wasteful_yaml = f.read()

print(f"📄 Read wasteful CI config ({len(wasteful_yaml)} bytes, 6 jobs)")
print(f"   Jobs: lint, build, test, pages, deploy, security_scan")
print(f"   All run on EVERY commit — no rules:changes: blocks")
print()

# Get project info
project = gitlab.get_project()
default_branch = project.get("default_branch", "main")
print(f"📋 Project: {project['name_with_namespace']}")
print(f"🌿 Default branch: {default_branch}")
print()

# Push the wasteful CI config
try:
    gitlab.create_commit(
        branch=default_branch,
        message="🧪 ECOOPS Demo: Add intentionally wasteful CI config for testing",
        actions=[{
            "action": "update",
            "file_path": ".gitlab-ci.yml",
            "content": wasteful_yaml,
        }]
    )
    print("✅ Pushed wasteful .gitlab-ci.yml to project!")
    print()
    print("🚀 Now run ECOOPS analysis via web dashboard or CLI to see it detect the waste.")
except Exception as e:
    if "A file with this name doesn't exist" in str(e):
        # File doesn't exist yet, use create action
        gitlab.create_commit(
            branch=default_branch,
            message="🧪 ECOOPS Demo: Add intentionally wasteful CI config for testing",
            actions=[{
                "action": "create",
                "file_path": ".gitlab-ci.yml",
                "content": wasteful_yaml,
            }]
        )
        print("✅ Created wasteful .gitlab-ci.yml in project!")
    else:
        print(f"❌ Failed: {e}")
        sys.exit(1)
