# Upload ECKEY THUMP v1.1 to GitHub

Existing destination: **https://github.com/connex222/ECKY-THUMP** (the repo name is spelled ECKY, but the game is ECKEY THUMP).

## Easy upload on Windows

1. Download the `ECKEY-THUMP-v1.1-GitHub-Upload-Ready.zip` file and extract it.
2. Open the `ECKEY-THUMP-Game-Night-v1.1-Flow` folder.
3. Double-click `UPLOAD-TO-GITHUB.bat`.
4. If Git is not installed, visit https://git-scm.com/download/win, install Git for Windows and run the `.bat` again.
5. A browser sign-in may appear; use your GitHub account.
6. After the message **SUCCESS**, check https://github.com/connex222/ECKY-THUMP.

If the upload fails, read the error on screen. The script will not use a force push, delete files from the existing repository or change its name. It does overwrite same-path project files with v1.1 content. It requires permission to push to the main branch.

## Using GitHub Desktop instead

If you prefer, clone the `connex222/ECKY-THUMP` repository using GitHub Desktop. Copy the extracted *contents* of this project folder into that clone (not the outer folder). Return to GitHub Desktop, review changes, enter `Update ECKEY THUMP to v1.1`, commit to main, and click **Push origin**.

## Important

GitHub stores source code. It does **not** automatically make this Node.js game playable on the public internet. For multi-house gameplay, deploy the repository to Render separately (the included `render.yaml` is provided for that purpose). The destination repository was public when checked on 20 October 2026: the game source and adult draft prompts will be visible to everyone after upload.
