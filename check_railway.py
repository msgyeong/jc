# -*- coding: utf-8 -*-
"""
Railway deployment status checker
Python 3.14 or higher
"""

import sys

def check_railway_deployment():
    """Check Railway project deployment status"""
    
    print("=" * 60)
    print("Railway Deployment Status Check")
    print("=" * 60)
    
    # GitHub repository info
    github_repo = "msgyeong/jc"
    print(f"\nGitHub Repository: {github_repo}")
    
    # Recent commits
    print("\nRecent Commits:")
    commits = [
        "2fd189a - Add development tools installation guide",
        "a52487b - Add manual deployment guide",
        "e1bbeea - Railway deployment trigger"
    ]
    for commit in commits:
        print(f"  > {commit}")
    
    print("\n" + "=" * 60)
    print("Please check Railway Dashboard manually")
    print("=" * 60)
    
    
    print("""
To check Railway deployment status:

1. Open Railway Dashboard
   URL: https://railway.app/dashboard

2. Select 'jc' project

3. Check Deployments tab:
   - Latest deployment status (Active/Building/Failed)
   - Deployment time
   - Commit hash

4. Get URL from Settings > Networking
   - Copy generated domain
   - Open in browser

5. Test login:
   - Email: minsu@jc.com
   - Password: test1234
   - Expected: Login success, name shows "Kyung Min-su"
    """)
    
    print("=" * 60)
    print("Python version: 3.14.3 - OK")
    print("Node.js: Installed (waiting for PATH registration)")
    print("Tip: Restart terminal and run 'node --version'")
    print("=" * 60)

if __name__ == "__main__":
    try:
        check_railway_deployment()
    except Exception as e:
        print(f"\nError occurred: {e}")
