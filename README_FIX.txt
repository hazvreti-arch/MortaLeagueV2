MortaLeague — Calculator Removal + Profile Modal Repair

Files in this patch:
- index.html: calculator page is absent; asset query revision bumped.
- style.css: removed legacy calculator-only CSS; added a high-priority, touch-friendly profile close button rule.
- app.js: closes the player profile as soon as a menu/page navigation is attempted, including before login/admin guards.
- service-worker.js: cache name and asset query revisions bumped so deployed phones stop reusing the previous CSS/JS shell.

Apply:
1. Extract this ZIP.
2. Replace the same-named files in the ROOT of the existing MortaLeague repository: index.html, style.css, app.js, service-worker.js.
3. Commit and allow Vercel to redeploy.
4. If the repository still contains calculator.js from an older version, delete that file in GitHub. The new index.html does not load it and the new app.js does not reference it, but deleting the orphaned file fully removes the old calculator implementation.
5. After deployment, reload the site. If installed as a PWA, fully close/reopen it once so the new service-worker revision activates.

No config.js, auth.js, social.js, messages.js, or Supabase keys are included or changed.
Validation performed locally: JavaScript syntax check, CSS calculator-selector removal check, ZIP integrity, and static checks for the navigation-close listener and profile close control. The live Vercel/Supabase session was not available for end-to-end testing.
