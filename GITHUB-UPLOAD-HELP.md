# ECKY THUMP — GitHub upload guide

The game's repository is **https://github.com/connex222/ECKY-THUMP**. The official product name is **ECKY THUMP**. Repository names are external identifiers and should not be silently renamed.

## Windows upload (current v1.8.2)

1. Extract the complete `ECKY-THUMP-v1.8.2-Game-Night-Quality-Playable.zip` archive to a folder.
2. Install Git for Windows and sign in to GitHub (if not already configured).
3. Open the extracted project folder and double-click **`UPLOAD-TO-GITHUB.bat`**.
4. The script clones `main`, copies in the current project files, creates a versioned commit, and pushes **without force**. It reports any authentication or branch-protection problems.
5. Verify the commit at https://github.com/connex222/ECKY-THUMP and check Render's deploy status separately.

**Alternative:** Clone the private repository in GitHub Desktop, copy the project contents into the clone, review the changes, then commit and push. Keep the original avatars unchanged.

## Notes

- This workflow overwrites matching source files but intentionally does **not** delete remote-only files. Old unused assets may therefore remain in GitHub until reviewed and removed separately.
- GitHub is source control, not the Node.js web host. Render deploys separately when configured for automatic deployment of `main`.
- Preserve the historic session, event, avatar and content-pack identifiers described in `docs/UK-ENGLISH-STYLE.md`.
- No deployment occurs merely by downloading this ZIP. This local quality release does not modify the connected GitHub repository or Render service.
