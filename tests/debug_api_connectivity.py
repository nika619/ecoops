"""Quick test to debug ECOOPS API connectivity."""
from dotenv import load_dotenv
import os
import requests

load_dotenv()

token = os.getenv("GITLAB_TOKEN")
pid = os.getenv("GITLAB_PROJECT_ID")
base = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")

print(f"Project ID: {pid}")
print(f"Token length: {len(token) if token else 0}")

headers = {"PRIVATE-TOKEN": token}

# Test 1: Project info
r = requests.get(f"{base}/api/v4/projects/{pid}", headers=headers, timeout=30)
print(f"\n1. Project: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    branch = data.get("default_branch", "main")
    print(f"   Name: {data['name']}")
    print(f"   Branch: {branch}")
else:
    print(f"   Error: {r.text[:200]}")
    exit(1)

# Test 2: Commits
r2 = requests.get(
    f"{base}/api/v4/projects/{pid}/repository/commits",
    headers=headers, params={"per_page": 5, "ref_name": branch}, timeout=30
)
print(f"\n2. Commits: {r2.status_code}")
if r2.status_code == 200:
    commits = r2.json()
    print(f"   Found {len(commits)} commits")
    for c in commits:
        print(f"   - {c['short_id']}: {c['title']}")

# Test 3: CI file
r3 = requests.get(
    f"{base}/api/v4/projects/{pid}/repository/files/.gitlab-ci.yml",
    headers=headers, params={"ref": branch}, timeout=30
)
print(f"\n3. CI file: {r3.status_code}")
if r3.status_code == 200:
    print("   .gitlab-ci.yml found!")
else:
    print(f"   Error: {r3.text[:200]}")

# Test 4: Repo tree
r4 = requests.get(
    f"{base}/api/v4/projects/{pid}/repository/tree",
    headers=headers, params={"ref": branch, "per_page": 20}, timeout=30
)
print(f"\n4. Repo tree: {r4.status_code}")
if r4.status_code == 200:
    items = r4.json()
    print(f"   Found {len(items)} items")

print("\n✅ All connectivity tests passed!" if all(
    x == 200 for x in [r.status_code, r2.status_code, r3.status_code, r4.status_code]
) else "\n❌ Some tests failed")
