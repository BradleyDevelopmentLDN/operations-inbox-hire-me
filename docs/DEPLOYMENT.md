# Vercel deployment record

Date: 18 October 2026

- Project: `operations-inbox-hire-me`
- Vercel project ID: `prj_2iVOzl3fwh4BsZNcx4C0dqxkLLY7`
- Deployment ID: `dpl_56rj21GFnRjNprceQFyS477bD38K`
- Target: **production**
- Vercel status: **READY**, verified with Vercel's project and deployment endpoints
- Domain: https://operations-inbox-hire-me.vercel.app
- Deployment protection: SSO **off**, password protection **off**
- Deployment source: compiled single-file `standalone-demo.html`, uploaded as `index.html` using Vercel's deployment API
- Source repository: https://github.com/BradleyDevelopmentLDN/operations-inbox-hire-me (separately published)
- Vercel Git connection: **not configured**; pushing changes to GitHub will not automatically update the deployment

## Verification boundary

The Vercel API accepted the deployment, assigned production domains and returned READY. The source file can be listed from the deployment file tree. On 18 October, the connected Vercel HTTP fetch returned **200 OK** with the expected Operations Inbox HTML. A complete interactive, public-browser end-to-end test remains unchecked. The equivalent compiled code passed offline browser interaction tests before deployment.

## Smoke-test checklist

- [ ] Open https://operations-inbox-hire-me.vercel.app in a normal or private window; confirm there is no Vercel login prompt or 404.
- [ ] Confirm Overview shows 18 fictional enquiries with overdue and unassigned highlights.
- [ ] Edit an item and refresh the page to check the browser's local storage persists.
- [ ] Download an operational summary and a CSV export.
- [ ] Use Reset demo to restore clean sample data.
