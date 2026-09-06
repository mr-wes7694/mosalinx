# Mosalinx Git & GitHub Workflow Guide

This guide documents the Git and GitHub workflow used by the Mosalinx development team. It is intended to provide a shared reference for the commands, processes, and practices used when working on Jira tasks, managing branches, submitting pull requests, reviewing code, resolving merge conflicts, and keeping local work synchronized with the team repository.

The goal of this guide is to help keep development work organized and isolated, reduce unnecessary merge conflicts and branch drift, and make it easier for team members to understand what Git is doing before making changes to the repository.

> **Important:** When Git produces unexpected output or the current repository state is unclear, stop before running additional commands. Use the verification and troubleshooting commands in this guide to determine the current branch and working-tree state before continuing.

## Table of Contents

1. [Quick Workflow Overview](#quick-workflow-overview)
2. [Starting a New Task](#starting-a-new-task)
3. [Creating and Working on a Branch](#creating-and-working-on-a-branch)
4. [Keeping Your Branch Updated with Main](#keeping-your-branch-updated-with-main)
5. [Committing and Pushing Changes](#committing-and-pushing-changes)
6. [Creating a Pull Request](#creating-a-pull-request)
7. [Pull Request Review Workflow](#pull-request-review-workflow)
8. [Handling Requested Changes](#handling-requested-changes)
9. [Resolving Merge Conflicts](#resolving-merge-conflicts)
10. [Merging and Cleaning Up Branches](#merging-and-cleaning-up-branches)
11. [Troubleshooting and Recovery](#troubleshooting-and-recovery)
12. [Terminal Compatibility](#terminal-compatibility)
13. [Quick Command Reference](#quick-command-reference)

## Quick Workflow Overview

For most Mosalinx Jira tasks, the Git/GitHub workflow should follow this general order:

1. Confirm the Jira task, completion criteria, and dependencies before beginning work.
2. Switch to `main` and pull the latest changes from the remote repository.
3. Create a dedicated task branch from the updated `main` branch.
4. Complete and test the task on the task branch.
5. Regularly synchronize the task branch with `main` while development is in progress.
6. Review changes with `git status` and `git diff` before committing.
7. Commit changes using the applicable Jira issue number and push the branch to GitHub.
8. Confirm the branch is current with `main` and complete applicable testing before requesting review.
9. Open a pull request into `main` and connect the work to the applicable Jira task.
10. Address any requested changes on the same task branch and push the updates for re-review.
11. Merge only after the work has passed review, testing, and the applicable Jira completion criteria.
12. Update local `main` after the merge and clean up the completed task branch.

> **Rule of Thumb:** `main` represents the team's current integrated project state. Task branches should begin from an updated `main` and should not be allowed to drift significantly behind it while development continues.

## Starting a New Task

Before beginning development work, review the Jira task that will be completed and confirm that the work is ready to begin.

### 1. Review the Jira Task

Confirm the following before making changes to the repository:

- Read the task description and completion criteria.
- Check the task's dependencies and linked work items.
- Confirm that any required blocking tasks have been completed.
- Verify that another team member is not already completing the same work.
- Note the Jira issue number, such as `MOS-304`, for use in the branch name, commit messages, and pull request.
- Move the Jira task to `IN PROGRESS` when development begins.

### 2. Check the Repository State

Before switching branches or pulling changes, check the current repository state:

```bash
git status
```

Confirm:

- Which branch is currently checked out.
- Whether the working tree contains modified or untracked files.
- Whether there are uncommitted changes that need to be handled before switching branches.

If unexpected changes are present, do not continue until their source and intended destination are understood.

### 3. Update `main`

New task branches should be created from the current version of `main`.

Switch to `main`:

```bash
git switch main
```

Pull the latest changes from the remote repository:

```bash
git pull origin main
```

Verify the repository state again:

```bash
git status
```

Once local `main` is current and the working tree is clean, the repository is ready for a new task branch.

## Creating and Working on a Branch

Each Jira task should be completed on a dedicated Git branch. Keeping work isolated by task makes changes easier to review, reduces merge conflicts, and ensures pull requests can be clearly associated with the work tracked in Jira.

### 1. Create the Task Branch

Before creating the branch, confirm that local `main` is current and the working tree is clean:

```bash
git status
```

Create and switch to a new branch from `main`:

```bash
git switch -c <branch-type>/MOS-<issue-number>-<short-description>
```

Example:

```bash
git switch -c docs/MOS-304-git-github-workflow
```

Use a branch type that reflects the work being completed. Common branch types include:

- `feature/` - New application functionality or feature development.
- `fix/` - Bug fixes or corrections to existing functionality.
- `docs/` - Documentation changes.
- `test/` - Testing-related work.
- `refactor/` - Code restructuring that does not introduce new functionality.

Branch names should:

- Include the Jira issue number.
- Include a short, descriptive summary of the task.
- Use lowercase words separated by hyphens.
- Avoid spaces and unnecessary special characters.
- Represent one primary Jira task whenever possible.

### 2. Verify the New Branch

After creating the branch, verify that the correct branch is checked out:

```bash
git branch --show-current
```

The output should match the branch created for the Jira task.

Check the working tree again:

```bash
git status
```

Git should report that you are on the new task branch and that the working tree is clean before development begins.

### 3. Work Only on the Task Branch

Complete development for the Jira task on its dedicated branch rather than directly on `main`.

While working:

- Keep changes focused on the scope of the Jira task.
- Avoid adding unrelated fixes or features to the same branch.
- Test changes as development progresses.
- Use `git status` regularly to understand the current working-tree state.
- Review changed files before staging or committing them.
- Keep the branch synchronized with `main` as development continues.

> **Important:** Do not develop directly on `main`. The `main` branch represents the team's integrated project state and should receive development changes through reviewed pull requests.

## Keeping Your Branch Updated with Main

While development is in progress, task branches should be synchronized with `main` regularly. This prevents branches from drifting significantly behind the team's current integrated project state and reduces the likelihood of large merge conflicts or outdated code during review.

### 1. Check the Current Repository State

Before bringing changes from `main` into a task branch, confirm that you are on the correct branch and understand the current working-tree state:

```bash
git status
```

Verify the current branch if needed:

```bash
git branch --show-current
```

Before continuing, make sure any current work is safely committed. Do not begin synchronizing branches while unexpected or unfinished changes are present in the working tree.

### 2. Fetch the Latest Remote Changes

Retrieve the latest repository information from GitHub:

```bash
git fetch origin
```

This updates the local repository's knowledge of remote branches without changing the files in the current working tree.

Check how far the current branch differs from remote `main`:

```bash
git rev-list --left-right --count HEAD...origin/main
```

The output contains two numbers:

```text
<branch-only commits> <main-only commits>
```

The second number indicates how many commits from `origin/main` are not currently included in the task branch.

### 3. Update Local `main`

Switch to `main`:

```bash
git switch main
```

Pull the latest changes:

```bash
git pull origin main
```

Verify that local `main` is current and the working tree is clean:

```bash
git status
```

### 4. Return to the Task Branch

Switch back to the task branch:

```bash
git switch <task-branch>
```

Example:

```bash
git switch docs/MOS-304-git-github-workflow
```

Verify the branch before continuing:

```bash
git status
```

### 5. Merge Updated `main` into the Task Branch

Bring the current state of `main` into the task branch:

```bash
git merge main
```

If Git reports that the merge completed successfully, verify the repository state:

```bash
git status
```

If merge conflicts occur, stop and resolve them carefully before continuing development. See [Resolving Merge Conflicts](#resolving-merge-conflicts) for the team workflow.

After successfully synchronizing the branch, run the applicable project tests before continuing work.

### 6. Push the Updated Branch

If the task branch has already been pushed to GitHub, push the synchronized version:

```bash
git push origin <task-branch>
```

Example:

```bash
git push origin docs/MOS-304-git-github-workflow
```

This ensures that the remote task branch also contains the current integrated changes from `main`.

> **Important:** Task branches should not be allowed to fall significantly behind `main`. Synchronize regularly during development and always synchronize before requesting or re-requesting pull request review. Review should be performed against the current integrated state of the project, not against an outdated version of `main`.

## Committing and Pushing Changes

Commits should represent clear, intentional checkpoints in the work completed for a Jira task. Before committing changes, review exactly what will be included and confirm that unrelated or sensitive files are not being added accidentally.

### 1. Review the Working Tree

Check the current repository state:

```bash
git status
```

Review the files that have changed:

```bash
git diff
```

If files have already been staged, review the staged changes separately:

```bash
git diff --staged
```

Before continuing, confirm that:

- The correct task branch is checked out.
- The changes belong to the current Jira task.
- No unrelated files have been modified accidentally.
- No sensitive files or credentials, such as `.env`, are being tracked.
- Generated files or dependencies that should be ignored are not being included.

> **Important:** Do not use `git add .` automatically without first reviewing the working tree. Stage changes intentionally so unexpected files are not included in the commit.

### 2. Stage the Changes

Stage individual files when possible:

```bash
git add <file-path>
```

Example:

```bash
git add documentation/development/GitGitHubWorkflow.md
```

Multiple specific files can also be staged together:

```bash
git add <file-1> <file-2>
```

After staging, verify what will be committed:

```bash
git status
git diff --staged
```

Only continue when the staged changes contain the intended work.

### 3. Commit the Changes

Commit messages should identify the Jira task associated with the work and briefly describe what was changed.

Use the following general format:

```text
MOS-<issue-number>: <short description>
```

Example:

```bash
git commit -m "MOS-304: add Git and GitHub workflow guide"
```

Commit messages should:

- Include the applicable Jira issue number.
- Briefly describe the completed change.
- Be specific enough to understand without opening the commit.
- Avoid vague descriptions such as `updates`, `changes`, or `fix stuff`.
- Keep unrelated work in separate commits when appropriate.

### 4. Verify the Commit

After committing, check the repository state:

```bash
git status
```

Review the most recent commit:

```bash
git log -1 --oneline
```

Confirm that:

- The commit appears on the correct task branch.
- The Jira issue number is included in the commit message.
- The working tree contains only expected remaining changes.

### 5. Push a New Task Branch

The first time a task branch is pushed to GitHub, set its upstream branch:

```bash
git push -u origin <task-branch>
```

Example:

```bash
git push -u origin docs/MOS-304-git-github-workflow
```

The `-u` option connects the local task branch to its corresponding remote branch.

After the upstream relationship has been established, future pushes from the same branch can normally use:

```bash
git push
```

### 6. Push Additional Commits

As development continues, commit additional completed work normally and push it to the same task branch:

```bash
git push
```

If the branch has been synchronized with `main`, push the updated branch after the merge and applicable testing have been completed.

Before requesting or re-requesting pull request review, confirm that all intended commits have been pushed to GitHub.

> **Rule of Thumb:** A commit existing locally does not mean the team can see it. Work must be pushed to the remote task branch before it can be reviewed through GitHub.

## Creating a Pull Request

A pull request should be created when the work for a Jira task is complete, tested, synchronized with the current `main` branch, and ready for team review. Pull requests provide the checkpoint where changes can be reviewed and verified before becoming part of the team's integrated project state.

### 1. Complete the Task Branch

Before creating a pull request, confirm that development for the Jira task is complete and that the branch contains only work associated with that task.

Check the repository state:

```bash
git status
```

Confirm that:

- The correct task branch is checked out.
- All intended changes have been committed.
- The working tree does not contain unexpected changes.
- The implementation satisfies the Jira task's completion criteria.
- Applicable testing has been completed successfully.

### 2. Synchronize with `main`

Before requesting review, ensure that the task branch contains the current integrated project state from `main`.

Follow the process described in [Keeping Your Branch Updated with Main](#keeping-your-branch-updated-with-main).

After synchronization, verify the repository state:

```bash
git status
```

Run the applicable project tests again after bringing in the latest changes from `main`.

If synchronization creates merge conflicts, resolve them before creating the pull request. See [Resolving Merge Conflicts](#resolving-merge-conflicts).

### 3. Push the Final Branch State

Push all completed and synchronized changes to GitHub:

```bash
git push
```

If the branch has not previously been pushed, establish its upstream branch:

```bash
git push -u origin <task-branch>
```

Confirm that the remote branch contains all intended commits before creating the pull request.

### 4. Open the Pull Request

On GitHub, create a pull request from the task branch into `main`.

Confirm that:

- **Base branch:** `main`
- **Compare branch:** the applicable task branch

Do not create a pull request from `main` into the task branch.

The pull request should represent one primary Jira task whenever possible.

### 5. Write the Pull Request Title

The pull request title should include the applicable Jira issue number and a concise description of the completed work.

Use the following general format:

```text
MOS-<issue-number>: <short description>
```

Example:

```text
MOS-304: Add Git and GitHub workflow guide
```

The title should make the purpose of the pull request understandable without requiring the reviewer to open the Jira task first.

### 6. Write the Pull Request Description

The pull request description should provide enough information for another team member to understand what was changed, why the change was made, and how the work was verified.

Use the following structure when applicable:

```markdown
## Summary

Briefly describe the purpose of the pull request and the work completed.

## Changes

- Describe the primary change.
- Describe additional relevant changes.
- Note any important implementation details.

## Testing

- Describe the testing performed.
- Include commands or workflows used when useful.
- Note the expected result.

## Jira

MOS-<issue-number>
```

Additional notes may be included when the reviewer needs information about dependencies, limitations, configuration requirements, or follow-up work.

### 7. Connect the Pull Request to Jira

Ensure that the pull request clearly references the applicable Jira issue.

The Jira issue number should appear in:

- The task branch name.
- Relevant commit messages.
- The pull request title.
- The pull request description.

Add the GitHub pull request link to the applicable Jira task when it is not already connected automatically.

This creates a clear path between the planned work in Jira and the implementation history in GitHub.

### 8. Perform a Final Self-Review

Before requesting another team member's review, inspect the pull request yourself.

Review the **Files changed** section on GitHub and confirm that:

- Only intended files are included.
- No credentials, secrets, or `.env` files are present.
- No unrelated changes were included accidentally.
- Debugging code or temporary files have been removed.
- Comments and documentation are understandable.
- The implementation still satisfies the Jira completion criteria.
- Testing has been completed against the current project state.

If anything unexpected appears, return to the task branch, correct the issue, commit the changes, and push again before requesting review.

### 9. Request Review

Once the pull request is ready, request review from another Mosalinx team member.

The person who completed the work should not be the only person responsible for verifying that the work is ready to merge.

Do not merge the pull request until the review process has been completed and any requested changes have been addressed.

> **Rule of Thumb:** Opening a pull request does not mean the work is finished. A pull request means the task branch is ready to be reviewed against the Jira completion criteria and the current integrated state of the project.

## Pull Request Review Workflow

Every pull request should be reviewed by another team member before it is merged into `main`. The purpose of review is not only to inspect the code itself, but also to verify that the implementation satisfies the associated Jira task, integrates correctly with the current project state, and does not introduce unintended changes.

### 1. Understand the Jira Task

Before reviewing the implementation, open the Jira issue associated with the pull request.

Review:

- The task description.
- Completion criteria.
- Dependencies and linked issues.
- Relevant implementation notes.
- Any previous comments or decisions that affect the expected behavior.

The Jira task defines what the implementation is expected to accomplish. Review should therefore be performed against both the code and the documented completion criteria.

### 2. Review the Pull Request on GitHub

Read the pull request title and description before inspecting individual files.

Confirm that:

- The pull request references the correct Jira issue.
- The purpose of the changes is clearly explained.
- Testing information has been provided when applicable.
- The changes appear consistent with the scope of the Jira task.

Then review the **Files changed** section.

Look for:

- Unexpected or unrelated file changes.
- Incorrect or incomplete implementation.
- Potential regressions.
- Debugging or temporary code.
- Sensitive information or credentials.
- Missing or unclear comments where explanation is necessary.
- Changes that conflict with established project structure or conventions.

Review comments should focus on specific, actionable issues whenever possible.

### 3. Test the Pull Request Locally

When the change requires functional verification, check out the pull request branch locally rather than relying only on the GitHub diff.

First, make sure existing local work is safely committed and the working tree is clean.

Fetch the latest remote branches:

```bash
git fetch origin
```

Switch to the pull request branch:

```bash
git switch <task-branch>
```

If the branch does not already exist locally, create a local tracking branch:

```bash
git switch --track origin/<task-branch>
```

Pull the latest changes if necessary:

```bash
git pull
```

Install or update dependencies when the pull request changes project dependencies:

```bash
npm install
```

Run the applicable project components and perform the testing required by the Jira completion criteria.

Testing may include:

- Starting the frontend or backend.
- Exercising the affected UI workflow.
- Sending requests to an API endpoint.
- Verifying database behavior.
- Testing authentication or permissions.
- Confirming expected error handling.
- Checking browser or terminal output for unexpected errors.
- Verifying that existing related functionality still works.

The exact testing process depends on the scope of the Jira task.

### 4. Verify the Completion Criteria

Compare the tested implementation directly against the completion criteria documented in Jira.

Each criterion should be individually considered rather than assuming that successful execution means the entire task is complete.

The reviewer should be able to determine whether each applicable requirement is:

- Verified.
- Not verified.
- Blocked from verification.
- Not applicable to the implementation.

If a criterion cannot be verified, document why rather than marking it complete without evidence.

### 5. Leave the Review Summary

After reviewing and testing the pull request, leave a structured review comment on GitHub.

Use the following general format:

```markdown
## Review Summary

Briefly describe what was reviewed and the overall result of testing.

### Testing Performed

- Describe the first test performed and its result.
- Describe additional testing and results.
- Note any relevant environment or configuration details.

### Verified

- [x] Applicable Jira completion criterion or verified behavior.
- [x] Additional verified behavior.
- [x] No unintended changes identified during review.

### Jira Status

State whether the associated Jira task appears to satisfy its documented completion criteria and note any remaining work if applicable.

### Review Result

**Approved** - The implementation satisfies the applicable completion criteria and is ready to merge.

OR

**Changes Requested** - Describe what must be corrected or completed before the pull request is ready to merge.
```

The review summary should reflect the testing actually performed. Do not mark functionality as verified when it was not tested or otherwise confirmed.

### 6. Approve or Request Changes

If the implementation satisfies the Jira completion criteria and no blocking issues remain, approve the pull request.

If corrections are required, request changes and clearly explain what needs to be addressed.

Requested changes should identify:

- What is incorrect or incomplete.
- Where the issue occurs when applicable.
- What behavior or result is expected.
- Which Jira completion criterion is affected when relevant.

Minor suggestions that do not prevent the task from satisfying its requirements may be documented separately without necessarily blocking approval.

### 7. Address Requested Changes

When changes are requested, the original developer should make the corrections on the same task branch unless there is a specific reason to create separate work.

After making the corrections:

```bash
git status
```

Stage the intended files:

```bash
git add <file-path>
```

Commit the corrections using the applicable Jira issue number:

```bash
git commit -m "MOS-<issue-number>: address pull request feedback"
```

Push the updated branch:

```bash
git push
```

The existing pull request will update automatically with the new commits.

The developer should notify the reviewer that the requested changes have been addressed and request another review.

### 8. Re-Review Updated Work

When a pull request changes after review, verify the new commits before approving it.

Focus on:

- Whether the requested changes were addressed.
- Whether the corrections introduced new problems.
- Whether affected completion criteria now pass.
- Whether the branch remains compatible with the current state of `main`.

Additional testing should be performed when the new commits affect behavior that was previously verified.

Do not rely solely on the previous approval when substantive changes have been added afterward.

### 9. Confirm the Branch Is Current Before Merge

Before final approval and merge, confirm that the task branch is not significantly behind `main`.

If `main` has changed since testing was performed, synchronize the task branch again using the process described in [Keeping Your Branch Updated with Main](#keeping-your-branch-updated-with-main).

Resolve any resulting conflicts and repeat applicable testing before merging.

This ensures that approval reflects the version of the work that will actually enter the integrated project.

> **Important:** Pull request approval represents verification of the reviewed branch state. If significant changes are made after approval, those changes should be reviewed before the pull request is merged.

## Handling Requested Changes

When a pull request receives requested changes, the work should normally continue on the same task branch and within the existing pull request. This keeps the full development and review history connected to the original Jira task.

### 1. Review the Feedback Carefully

Before making changes, read the complete review and any inline comments left on GitHub.

Identify:

- Which Jira completion criteria are affected.
- Which files or areas of the implementation require changes.
- Whether the issue is functional, structural, configuration-related, or documentation-related.
- Whether any requested change depends on another Jira task or branch.
- Whether additional clarification is needed before modifying the code.

Do not begin making changes until the requested work is understood.

### 2. Update the Jira Task

If the Jira task was previously moved to `READY FOR REVIEW`, move it to:

```text
CHANGES NEEDED
```

Add a Jira comment summarizing the review result when appropriate.

The comment should identify:

- The pull request that was reviewed.
- What was successfully verified.
- What still needs to be corrected.
- Any dependencies or blockers preventing completion.

Detailed code-specific findings may remain documented in the GitHub review and inline comments rather than being duplicated fully in Jira.

### 3. Confirm the Task Branch

Before modifying the implementation, confirm that the correct task branch is checked out:

```bash
git branch --show-current
```

Check the repository state:

```bash
git status
```

If the pull request branch has changed remotely since the last local update, fetch the latest information:

```bash
git fetch origin
```

Then update the local task branch as needed before continuing.

### 4. Synchronize with `main` Before Continuing

If `main` has changed since the previous review, synchronize the task branch before completing additional work.

Follow the process in [Keeping Your Branch Updated with Main](#keeping-your-branch-updated-with-main).

This is especially important when requested changes involve files that may also have changed elsewhere in the project.

Resolve any merge conflicts before modifying the reviewed implementation.

### 5. Address the Requested Changes

Make the required corrections on the existing task branch.

Keep changes focused on the review findings and the applicable Jira task.

As corrections are made:

- Preserve functionality that was already verified.
- Avoid rewriting unrelated working code unless necessary.
- Re-check dependencies affected by the change.
- Follow existing project structure and conventions.
- Remove obsolete temporary or workaround code when replacing it with the corrected implementation.

If review comments were attached to specific lines of code, use those comments as a reference while completing the correction.

### 6. Re-Test the Affected Functionality

Requested changes should be tested before they are pushed for re-review.

Testing should cover:

- The specific issue identified by the reviewer.
- The Jira completion criteria affected by the change.
- Related functionality that could reasonably be impacted.
- Any previously verified behavior that was modified during the correction.

If the requested change affects integration between multiple systems, repeat the relevant integration testing rather than verifying only the edited file.

### 7. Review the Changes Before Committing

Check the working tree:

```bash
git status
```

Review the changes:

```bash
git diff
```

Confirm that the correction contains only the intended work.

Stage the appropriate files:

```bash
git add <file-path>
```

Review the staged changes:

```bash
git diff --staged
```

### 8. Commit the Corrections

Use the applicable Jira issue number in the commit message.

Example:

```bash
git commit -m "MOS-302: address resource upload review findings"
```

The commit message should describe the correction rather than using a vague message such as `fix review`.

### 9. Push to the Existing Pull Request

Push the new commit to the same task branch:

```bash
git push
```

GitHub will automatically update the existing pull request with the new commit.

Do not create a second pull request solely to address requested changes unless the work has intentionally been separated into a different Jira task or branch.

### 10. Request Re-Review

Once the corrections have been pushed and tested, notify the reviewer that the pull request is ready for re-review.

When useful, briefly summarize:

- Which requested changes were addressed.
- What testing was repeated.
- Whether any review finding remains blocked or incomplete.

The reviewer should verify the new branch state before the pull request is approved.

### 11. Resolve Review Conversations

GitHub review conversations should be resolved only after the associated concern has been addressed or intentionally closed through team agreement.

Do not resolve a review conversation simply to clear the pull request interface.

If additional discussion is required, continue the conversation on the applicable review thread so the reasoning remains attached to the relevant code.

> **Important:** Requested changes are part of the pull request's review history, not a failure of the workflow. Keeping corrections on the same branch and pull request preserves a clear record of what was identified, changed, and ultimately verified.

## Resolving Merge Conflicts

Merge conflicts occur when Git cannot automatically determine how changes from two branches should be combined. A conflict does not necessarily indicate that either branch is incorrect. It means that overlapping changes require a developer to decide what the final integrated version should contain.

Conflicts should be resolved carefully. Do not choose one version automatically without first understanding what changed on both branches.

### 1. Confirm the Current Branch and Repository State

Before attempting to resolve a conflict, verify the current repository state:

```bash
git status
```

Confirm the current branch if needed:

```bash
git branch --show-current
```

Make sure that:

- You are working on the intended task branch.
- Existing development work has been safely committed.
- You understand which branches are being combined.
- Unexpected working-tree changes are not present.

Do not begin a merge with unfinished or unexplained local changes.

### 2. Update the Repository Before Merging

Retrieve the latest remote repository information:

```bash
git fetch origin
```

If the goal is to synchronize a task branch with `main`, first update local `main`:

```bash
git switch main
git pull origin main
```

Return to the task branch:

```bash
git switch <task-branch>
```

Then merge the updated `main` branch:

```bash
git merge main
```

If Git can combine the branches automatically, the merge will complete without manual conflict resolution.

If Git reports conflicts, do not continue with normal development until they have been resolved.

### 3. Identify the Conflicted Files

Check the repository state:

```bash
git status
```

Git will identify files containing unresolved conflicts.

A conflicted file may contain markers similar to:

> `<<<<<<< HEAD`
>
> Content from the currently checked-out branch.
>
> `=======`
>
> Content from the branch being merged.
>
> `>>>>>>> main`

These markers divide the competing versions:

- `<<<<<<< HEAD` begins the version from the currently checked-out branch.
- `=======` separates the two versions.
- `>>>>>>> main` ends the version coming from the branch being merged.

The conflict markers are temporary and must not remain in the final committed file.

### 4. Understand Both Versions Before Editing

Before resolving a conflict, determine what each version is attempting to accomplish.

Review:

- The associated Jira tasks.
- Relevant pull requests and commits.
- The current version on `main`.
- The implementation on the task branch.
- Dependencies between the conflicting changes.
- Whether both changes are still required.

The correct resolution is not always to keep one side exactly as written.

A valid resolution may require:

- Keeping the task branch version.
- Keeping the `main` version.
- Combining both versions.
- Rewriting the conflicting section so both intended behaviors are preserved.

> **Important:** Do not use "Accept Current Change" or "Accept Incoming Change" simply because one version appears newer. Determine which behavior belongs in the integrated project first.

### 5. Resolve the Conflict

Open each conflicted file and edit it into the intended final state.

When using VS Code, conflict resolution controls may provide options such as:

- **Accept Current Change**
- **Accept Incoming Change**
- **Accept Both Changes**
- **Compare Changes**

These controls may be useful, but the resulting code should still be reviewed manually.

After resolving the file:

- Remove all conflict markers.
- Preserve required behavior from both branches when applicable.
- Remove duplicated code created by combining changes.
- Verify imports, variables, routes, components, and configuration affected by the resolution.
- Confirm that the resulting file remains syntactically valid.

### 6. Check for Remaining Conflict Markers

After editing all conflicted files, check the repository state:

```bash
git status
```

Git should no longer report unresolved paths once every conflict has been resolved and staged.

It can also be useful to search the affected files for unresolved conflict markers:

- `<<<<<<<`
- `=======`
- `>>>>>>>`

Be careful when searching for `=======`, since that sequence could theoretically appear legitimately in other content. The primary goal is to ensure that Git conflict markers have not been accidentally committed.

### 7. Stage the Resolved Files

After verifying the resolution, stage each resolved file intentionally:

```bash
git add <file-path>
```

Repeat this for each conflicted file.

Then check the repository state:

```bash
git status
```

Git should indicate that all conflicts have been fixed and that the merge is ready to be completed.

Review the staged changes before committing:

```bash
git diff --staged
```

### 8. Complete the Merge

Once all conflicts have been resolved and staged, complete the merge.

Depending on the Git state, Git may prompt for or automatically prepare a merge commit.

If a commit is required:

```bash
git commit
```

Use the generated merge message when appropriate, or provide a clear message identifying the synchronization.

Example:

```bash
git commit -m "Merge main into MOS-<issue-number> task branch"
```

### 9. Test the Resolved Branch

A successful Git merge does not guarantee that the application still works correctly.

After resolving conflicts, run the applicable project tests and manually verify affected functionality.

Testing should include:

- Functionality changed by the task branch.
- Functionality introduced or modified by `main`.
- Areas where the conflict occurred.
- Integration between the previously conflicting changes.
- Relevant Jira completion criteria.

For frontend or backend changes, start the applicable application components and check for runtime errors.

For database-related conflicts, verify that schemas, migrations, queries, and application expectations remain compatible.

### 10. Push the Resolved Branch

After the merge has been completed and testing succeeds, push the updated task branch:

```bash
git push
```

If the branch already has an open pull request, GitHub will update the existing pull request automatically.

Review the pull request again after pushing to confirm that the resulting diff contains the intended integrated implementation.

### 11. Re-Request Review When Necessary

If conflict resolution changed code that had already been reviewed, the affected portions should be reviewed again.

This is especially important when:

- The conflict involved functional code.
- Both versions had to be combined manually.
- Previously tested behavior changed.
- `main` introduced substantial changes.
- The resolution required restructuring the implementation.

Do not assume that an approval given before conflict resolution automatically verifies the resolved version.

### Aborting a Merge

If the conflict becomes unclear, unexpected, or unsafe to resolve, the merge can normally be abandoned before it has been committed:

```bash
git merge --abort
```

This returns the repository to its state before the merge attempt.

After aborting:

```bash
git status
```

Confirm that the repository has returned to the expected state before attempting another approach.

Aborting is preferable to guessing when the correct integration cannot be determined confidently.

### When a Conflict Involves Another Team Member's Work

If a conflict involves implementation owned or recently modified by another team member and the correct resolution is unclear, consult that team member before completing the merge.

Provide:

- The conflicting files.
- The relevant Jira tasks.
- The competing changes.
- The behavior that needs to be preserved.

The developer resolving the conflict should not silently discard another team member's work simply to make Git report a successful merge.

> **Rule of Thumb:** The goal of conflict resolution is not to make the conflict markers disappear. The goal is to produce the correct integrated version of the project while preserving all required behavior.

## Merging an Approved Pull Request

A pull request should be merged into `main` only after review has been completed, all requested changes have been addressed, applicable testing has passed, and the associated Jira completion criteria have been verified.

Merging represents the point at which the task becomes part of the team's integrated project state. The merge should therefore be treated as a deliberate final step rather than simply closing the pull request.

### 1. Confirm Final Approval

Before merging, confirm on GitHub that:

- The pull request has been reviewed by another Mosalinx team member.
- The reviewer has approved the current version of the pull request.
- No unresolved requested changes remain.
- Relevant review conversations have been resolved.
- Required testing has been completed successfully.
- The Jira completion criteria have been verified.
- No unexpected files or changes are included.

If significant commits were pushed after the most recent approval, those changes should be reviewed before the pull request is merged.

### 2. Confirm the Branch Is Current with `main`

Verify that the pull request branch is compatible with the current integrated project state.

If `main` has changed since the branch was last synchronized or tested, update the task branch using the process described in [Keeping Your Branch Updated with Main](#keeping-your-branch-updated-with-main).

Resolve any merge conflicts and repeat applicable testing before proceeding.

Do not merge a task branch based only on testing performed against an outdated version of `main`.

### 3. Perform the Final GitHub Check

Before selecting the merge option, review the pull request one final time.

Confirm:

- **Base branch:** `main`
- **Compare branch:** the applicable task branch
- The pull request title references the correct Jira issue.
- The pull request description accurately reflects the completed work.
- The **Files changed** section contains only intended changes.
- GitHub does not report unresolved merge conflicts.
- The latest reviewed commits are present.

If anything unexpected appears, stop and investigate before merging.

### 4. Merge the Pull Request

Once the pull request has passed review and final verification, merge it into `main` using the repository's approved GitHub merge method.

Confirm the merge when prompted.

After the merge completes, verify that GitHub reports the pull request as merged rather than merely closed.

> **Important:** Do not manually close an approved pull request instead of merging it. Closing a pull request does not integrate the task branch into `main`.

### 5. Update Local `main`

After the GitHub merge completes, update the local repository.

First, check the current repository state:

```bash
git status
```

Make sure any unrelated local work is safely handled before switching branches.

Switch to `main`:

```bash
git switch main
```

Retrieve the merged changes:

```bash
git pull origin main
```

Verify the repository state:

```bash
git status
```

Local `main` should now contain the merged implementation and the working tree should be clean.

### 6. Verify the Integrated Project State

The fact that GitHub successfully merged the pull request does not by itself confirm that the integrated application works correctly.

Run the applicable project components and verify the merged functionality from `main`.

Depending on the task, verification may include:

- Starting the backend.
- Starting the frontend.
- Testing the affected user workflow.
- Verifying API behavior.
- Confirming database operations.
- Testing authentication or permissions.
- Checking integrations between frontend and backend functionality.
- Confirming that previously working related functionality still behaves as expected.
- Checking the browser console and terminal for unexpected errors.

The purpose of this check is to confirm that the functionality works as part of the integrated project, not only from the isolated task branch.

### 7. Update Jira to `VERIFIED COMPLETE`

After the merged implementation has been verified from `main`, update the associated Jira task to:

```text
VERIFIED COMPLETE
```

Do not move the task to `VERIFIED COMPLETE` merely because the pull request was merged.

The status indicates that:

- Development was completed.
- The work passed review.
- Applicable completion criteria were verified.
- The pull request was merged into `main`.
- The resulting integrated implementation was successfully checked.

Add a final verification comment to Jira when appropriate.

A verification comment should briefly document:

- The pull request that was merged.
- The integrated functionality that was verified.
- Relevant testing performed from `main`.
- The final verification result.

Example:

```text
Verified Complete

PR #<number> was reviewed and merged into main.

Verification performed from the updated main branch:
- Confirmed expected functionality.
- Verified applicable completion criteria.
- Confirmed no unexpected errors during integration testing.

Result: VERIFIED COMPLETE
```

Adjust the verification details to reflect the testing actually performed for the task.

### 8. Delete the Completed Task Branch

Once the pull request has been merged and the integrated work has been verified, the completed task branch can be removed.

If GitHub offers the option to delete the remote branch after the merge, it may be deleted there.

To remove the local branch, first make sure `main` is checked out:

```bash
git branch --show-current
```

Then delete the completed local task branch:

```bash
git branch -d <task-branch>
```

Example:

```bash
git branch -d docs/MOS-304-git-github-workflow
```

The `-d` option performs a safe deletion and will normally refuse to delete a branch Git considers unmerged.

If Git reports that the branch is not fully merged, investigate the reason before considering a forced deletion.

Do not automatically use:

```bash
git branch -D <task-branch>
```

A forced deletion should only be used when the branch state is understood and the work is known to be safely preserved elsewhere.

### 9. Clean Up Remote Branch References

After a remote task branch has been deleted, update the local repository's remote references:

```bash
git fetch --prune
```

This removes local references to remote branches that no longer exist.

You can review the remaining branches with:

```bash
git branch
```

And remote branches with:

```bash
git branch -r
```

Completed task branches should not be left indefinitely when they are no longer needed.

### 10. Confirm the Repository Is Ready for the Next Task

Before beginning another Jira task, perform one final check:

```bash
git switch main
git pull origin main
git status
```

Confirm that:

- `main` is checked out.
- Local `main` matches the current remote project state.
- The working tree is clean.
- The completed task branch has been removed when appropriate.
- The previous Jira task is `VERIFIED COMPLETE`.

The repository is now ready for the next task to begin using the process described in [Starting a New Task](#starting-a-new-task).

> **Rule of Thumb:** A merged pull request is not the end of a Mosalinx task. The task is complete only after the merged implementation has been verified from the integrated `main` branch, Jira has been updated accordingly, and the completed development branch has been cleaned up.

## Recovering from Common Git Mistakes

Git mistakes are usually recoverable when they are identified early. When something unexpected happens, avoid making additional changes until the current repository state is understood.

Start with:

```bash
git status
git branch --show-current
```

These commands should be the first troubleshooting step in most situations.

> **Rule of Thumb:** When Git behaves unexpectedly, stop and inspect the repository before running additional commands. Do not attempt random fixes until the current branch, working tree, and intended destination of the changes are understood.

### 1. Changes Were Made on the Wrong Branch

If files were modified on the wrong branch but the changes have **not been committed**, do not discard them.

First, check the working tree:

```bash
git status
```

If Git allows the intended branch to be checked out without overwriting changes, switch to it:

```bash
git switch <correct-branch>
```

Then verify:

```bash
git status
```

The uncommitted changes should remain in the working tree and can be completed on the correct branch.

If Git prevents the switch because the changes would conflict with the destination branch, do not force the switch. Preserve the work before continuing.

One option is to temporarily stash the changes:

```bash
git stash push -m "temporary work for MOS-<issue-number>"
```

Switch to the correct branch:

```bash
git switch <correct-branch>
```

Restore the saved changes:

```bash
git stash pop
```

Review the restored files carefully before continuing.

### 2. Work Was Accidentally Started on `main`

If development changes were made directly on `main` but have **not been committed**, the work can normally be moved to a task branch.

Check the current state:

```bash
git status
```

Create and switch to the appropriate task branch:

```bash
git switch -c <branch-type>/MOS-<issue-number>-<short-description>
```

The uncommitted working-tree changes will normally move with the new branch.

Verify:

```bash
git branch --show-current
git status
```

Continue the work from the task branch.

Do not commit the development changes to `main`.

### 3. A Commit Was Made on the Wrong Branch

If a commit was created on the wrong branch, stop before pushing additional changes.

Inspect recent history:

```bash
git log --oneline --decorate -5
```

Identify:

- The incorrect commit.
- The branch where the commit currently exists.
- The branch where the commit belongs.
- Whether the commit has already been pushed or shared.

Moving commits can alter repository history. The safest recovery method depends on whether the commit exists only locally or has already been published.

If the correct recovery is unclear, consult another team member before resetting, rebasing, force-pushing, or otherwise rewriting history.

### 4. Local Changes Are Blocking a Branch Switch

Git may refuse to switch branches when local changes would be overwritten.

Check:

```bash
git status
```

Determine whether the changes should be:

- Committed to the current task branch.
- Moved to another task branch.
- Temporarily stashed.
- Intentionally discarded.

To temporarily preserve valid unfinished work:

```bash
git stash push -m "temporary work for MOS-<issue-number>"
```

After switching to the appropriate branch, restore it with:

```bash
git stash pop
```

Always inspect the working tree after restoring a stash:

```bash
git status
git diff
```

### 5. A File Was Modified Accidentally

If an uncommitted tracked file contains changes that should be discarded, first inspect the difference:

```bash
git diff <file-path>
```

If the changes are definitely unwanted, restore the file to its current committed version:

```bash
git restore <file-path>
```

Then verify:

```bash
git status
```

> **Warning:** `git restore` can permanently discard uncommitted changes. Do not use it until the changes have been reviewed and confirmed unnecessary.

### 6. A File Was Staged Accidentally

If the file should remain modified but should not be included in the next commit, remove it from the staging area:

```bash
git restore --staged <file-path>
```

This does not normally discard the file's working-tree changes.

Verify:

```bash
git status
```

The file should now appear as modified but unstaged.

### 7. Sensitive or Unrelated Files Were Staged

If `git status` or `git diff --staged` reveals a file that should not be committed, unstage it immediately:

```bash
git restore --staged <file-path>
```

Examples include:

- `.env`
- Credentials or API keys.
- Local configuration files not intended for the repository.
- Generated dependencies.
- Temporary debugging files.
- Unrelated project changes.

If a credential or secret has already been pushed to GitHub, removing the file in a later commit is not sufficient to guarantee that the secret is protected. Notify the team and rotate or revoke the exposed credential as soon as possible.

### 8. The Branch Is Behind `main`

If development has continued while `main` has changed, do not ignore the difference until the pull request is ready to merge.

Follow the process in [Keeping Your Branch Updated with Main](#keeping-your-branch-updated-with-main).

After synchronization:

- Resolve any conflicts.
- Repeat affected testing.
- Push the updated task branch.
- Re-review the pull request when necessary.

Regular synchronization reduces the risk of larger integration problems later.

### 9. A Merge Was Started by Mistake

If a merge is in progress and should not be completed, check:

```bash
git status
```

If the merge has not been committed and it is safe to abandon the attempt:

```bash
git merge --abort
```

Then verify:

```bash
git status
```

Do not attempt to manually delete conflict markers simply to escape an unwanted merge.

### 10. A Pull Request Was Opened in the Wrong Direction

A Mosalinx task pull request should normally use:

```text
Base: main
Compare: <task-branch>
```

If the pull request was accidentally configured in the opposite direction, do not merge it.

Correct the pull request configuration on GitHub when possible or close the incorrect pull request and create the proper one.

Always inspect the **Files changed** section before requesting review.

### 11. A Pull Request Was Closed Instead of Merged

Closing a pull request does not merge its changes into `main`.

If the task branch still exists and the work should be integrated:

- Confirm that the branch still contains the intended work.
- Reopen the pull request when appropriate or create a new pull request.
- Complete review and testing.
- Merge the approved implementation normally.

Do not mark the Jira task `VERIFIED COMPLETE` until the implementation has actually been merged and verified from `main`.

### 12. A Branch Was Deleted Too Early

If a branch was deleted after its work was safely merged into `main`, the implementation remains preserved in the repository history.

Confirm that the expected commits exist on `main`:

```bash
git switch main
git pull origin main
git log --oneline
```

If the work was **not** merged, stop before attempting additional cleanup or history changes.

Git may still contain references that allow the work to be recovered, but recovery depends on the exact repository state.

Ask another team member for assistance rather than guessing when potentially unmerged work is involved.

### 13. Local `main` Appears Different from GitHub

First retrieve the latest remote information:

```bash
git fetch origin
```

Check the repository:

```bash
git status
git branch --show-current
```

If `main` is checked out and the working tree is clean:

```bash
git pull origin main
```

Then verify:

```bash
git status
```

If unexpected differences remain, inspect the commit history before attempting resets or other destructive commands.

### 14. When to Stop and Ask for Help

Stop troubleshooting and consult another team member when:

- You are unsure whether work has been pushed.
- A commit appears to be missing.
- A branch containing potentially unmerged work was deleted.
- Git reports conflicts whose intended resolution is unclear.
- A secret or credential may have been committed.
- Fixing the problem appears to require rewriting shared history.
- A command would require `--force`, `-f`, `-D`, `reset --hard`, or another destructive option that you do not fully understand.
- You cannot confidently explain what the proposed recovery command will change.

Before asking for help, collect:

```bash
git status
git branch --show-current
git log --oneline --decorate -10
```

When relevant, also retrieve current remote information:

```bash
git fetch origin
```

Providing the repository state makes it easier to determine a safe recovery path.

> **Important:** Do not use destructive Git commands simply because they appear in a search result or troubleshooting guide. Commands such as `git reset --hard`, forced branch deletion, and force pushing can permanently discard work or alter shared repository history. Understand the repository state and the effect of the command before proceeding.

## Terminal Compatibility

The Mosalinx Git workflow is written primarily using **Git Bash** on Windows. Most Git commands in this guide also work in PowerShell, Command Prompt, macOS Terminal, and Linux terminals because the commands themselves are provided by Git rather than by the shell.

### Git Bash

Git Bash is the recommended terminal for following this guide on Windows.

Examples:

```bash
git status
git switch main
git pull origin main
git --no-pager diff main...HEAD
```

The commands and examples throughout this guide can generally be copied directly into Git Bash.

### PowerShell

Standard Git commands also work in PowerShell:

```powershell
git status
git switch main
git pull origin main
git --no-pager diff main...HEAD
```

However, commands that use Unix shell utilities or syntax may behave differently in PowerShell.

Examples of utilities commonly available in Git Bash but not necessarily used the same way in PowerShell include:

```text
grep
sed
cat
find
```

When a troubleshooting or review command combines Git with one of these utilities, use Git Bash unless a PowerShell-specific equivalent is known.

### Command Prompt

Standard Git commands can also be executed through Windows Command Prompt when Git is installed and available through the system path.

For example:

```text
git status
git branch --show-current
git fetch origin
git pull origin main
```

Some command formatting and shell utilities used elsewhere in this guide may not work identically in Command Prompt.

Git Bash is preferred when following the guide exactly.

### macOS and Linux

The standard Git commands documented in this guide should also work from macOS and Linux terminals when Git is installed.

Shell utilities such as `grep`, `sed`, `cat`, and `find` are also commonly available in these environments.

File paths and environment configuration may differ from the Windows development environment used by the Mosalinx team.

### Using `--no-pager`

Some Git commands may open their output inside Git's pager rather than printing the complete result directly to the terminal.

For example:

```bash
git diff main...HEAD
```

or:

```bash
git log --oneline
```

When output should remain directly in the terminal, use `--no-pager`:

```bash
git --no-pager diff main...HEAD
```

```bash
git --no-pager log --oneline --decorate -10
```

This is especially useful when:

- Copying command output for another team member.
- Sharing output during code review.
- Troubleshooting repository state.
- Comparing task branches against `main`.
- Recording Git information for documentation.

### Repository Paths

Always confirm that the terminal is currently operating inside the Mosalinx repository before running repository-specific commands.

In Git Bash:

```bash
pwd
```

The terminal prompt also normally displays the current repository branch when Git Bash recognizes the directory as a Git repository.

Example:

```text
VJNic@Nica MINGW64 /d/FSU/CAPSTONE/Mosalinx (docs/MOS-304-git-github-workflow)
```

In this example:

- `/d/FSU/CAPSTONE/Mosalinx` is the current repository directory.
- `docs/MOS-304-git-github-workflow` is the currently checked-out branch.

If necessary, navigate to the repository before continuing:

```bash
cd /d/FSU/CAPSTONE/Mosalinx
```

The exact path will differ between team members.

### When Following Commands from This Guide

Unless a section specifically states otherwise:

1. Run commands from the Mosalinx repository root.
2. Confirm the current branch before making changes.
3. Use Git Bash when following shell-specific examples.
4. Do not assume another team member's local file path will match your own.
5. Use `--no-pager` when terminal output needs to be copied, reviewed, or shared.

> **Rule of Thumb:** Git commands are generally portable between terminals, but shell utilities and file paths are not. When following the Mosalinx guide on Windows, Git Bash provides the environment most closely matching the documented examples.

## Quick Command Reference

This section provides a condensed reference for commonly used Git commands in the Mosalinx workflow.

### Repository Status and Branch Information

Check the current repository state:

```bash
git status
```

Show the currently checked-out branch:

```bash
git branch --show-current
```

List local branches:

```bash
git branch
```

Show local branches with remote tracking information:

```bash
git branch -vv
```

List remote branches:

```bash
git branch -r
```

### Updating Repository Information

Retrieve the latest remote repository information without modifying the current branch:

```bash
git fetch origin
```

Retrieve remote updates and remove stale remote-tracking references:

```bash
git fetch --prune
```

Update local `main` from GitHub:

```bash
git switch main
git pull origin main
```

### Creating and Switching Branches

Create and switch to a new task branch:

```bash
git switch -c <branch-type>/MOS-<issue-number>-<short-description>
```

Example:

```bash
git switch -c docs/MOS-304-git-github-workflow
```

Switch to an existing branch:

```bash
git switch <branch-name>
```

Create a local branch that tracks an existing remote branch:

```bash
git switch --track origin/<branch-name>
```

### Comparing Branches

Check how many commits the current branch and remote `main` each contain that the other does not:

```bash
git rev-list --left-right --count HEAD...origin/main
```

Compare the current branch against `main`:

```bash
git --no-pager diff main...HEAD
```

Compare specific files against `main`:

```bash
git --no-pager diff main -- <file-path>
```

View the most recent commit history:

```bash
git --no-pager log --oneline --decorate -10
```

View recent history as a branch graph:

```bash
git --no-pager log --oneline --decorate --graph --all -15
```

### Reviewing Local Changes

Review unstaged changes:

```bash
git --no-pager diff
```

Check the diff for common whitespace problems:

```bash
git diff --check
```

Review staged changes:

```bash
git --no-pager diff --staged
```

Show a summary of staged file changes:

```bash
git --no-pager diff --staged --stat
```

### Staging Changes

Stage one file:

```bash
git add <file-path>
```

Stage multiple specific files:

```bash
git add <file-1> <file-2>
```

Remove a file from the staging area without discarding its working-tree changes:

```bash
git restore --staged <file-path>
```

### Committing Changes

Create a commit:

```bash
git commit -m "MOS-<issue-number>: <short description>"
```

Example:

```bash
git commit -m "MOS-304: add Git and GitHub workflow guide"
```

Review the most recent commit:

```bash
git log -1 --oneline
```

### Pushing Changes

Push a new branch and create its upstream relationship:

```bash
git push -u origin <branch-name>
```

Push later commits from a branch that already has an upstream:

```bash
git push
```

Delete a remote branch:

```bash
git push origin --delete <branch-name>
```

### Synchronizing a Task Branch with `main`

Update local `main`:

```bash
git switch main
git pull origin main
```

Return to the task branch:

```bash
git switch <task-branch>
```

Merge updated `main` into the task branch:

```bash
git merge main
```

Push the synchronized task branch:

```bash
git push
```

### Merge Conflict Commands

Check which files are conflicted:

```bash
git status
```

Stage a resolved conflict:

```bash
git add <file-path>
```

Complete the merge after all conflicts are resolved and staged:

```bash
git commit
```

Abort an uncommitted merge attempt:

```bash
git merge --abort
```

### Temporary Work and Stashes

Temporarily save unfinished working-tree changes:

```bash
git stash push -m "temporary work for MOS-<issue-number>"
```

View saved stashes:

```bash
git stash list
```

Restore the most recent stash and remove it from the stash list:

```bash
git stash pop
```

### Restoring Files

Discard unwanted uncommitted changes to a tracked file:

```bash
git restore <file-path>
```

> **Warning:** `git restore <file-path>` discards the uncommitted changes in that file. Review the changes before using it.

### Branch Cleanup

Delete a merged local branch:

```bash
git branch -d <branch-name>
```

Remove stale remote branch references:

```bash
git fetch --prune
```

### Recommended First Commands When Something Looks Wrong

When the repository state is unclear, start with:

```bash
git status
git branch --show-current
git --no-pager log --oneline --decorate -10
```

If remote branch information may be outdated:

```bash
git fetch origin
```

These commands provide the information needed to understand the repository state before making additional changes.

> **Final Reminder:** Git commands affect the repository differently depending on the currently checked-out branch and working-tree state. When unsure, inspect the repository before acting.
