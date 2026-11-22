# Redux migration report

One store in [src/store/index.js](src/store/index.js) serves the entire React app. Each of the six role reducers owns both its existing workspace data and the view records listed below. Public and login views live in the public slice. Shared account and modal views use the signed-in role's slice.

## Application state audit

- Found **zero** useState or useReducer usages in src. There were no useReducer implementations to migrate.
- Candidate StoreContext and UIContext and the shared PlatformDataContext no longer create or consume React Context. Their consumers select Redux data or dispatch Redux commands. Candidate and platform providers still schedule lifecycle work.
- View records are independent per mounted instance. Redux discards them on unmount and clears role data when the account changes. Existing route and tab resets also clear drafts. Inputs render Redux values and dispatch updates. The candidate application wizard includes contact and screening fields that previously used browser defaults.
- React refs remain for lifecycle checks, timers, browser navigation callbacks, DOM elements, and Chart.js instances. Native file inputs provide File objects directly to the existing file readers and upload handlers. Redux holds the resulting file information and preview URLs.
- Selected application, opportunity, and recruiter records use IDs in the affected views and resolve data from the current lists. An editor's draft remains independent from its saved record while editing.

## Redux actions, reducers, selectors, and requests

| Area | Changes |
| --- | --- |
| Role and public views | views/mounted, views/fieldChanged, and views/unmounted register, update, and release role-owned records. selectView reads the scoped record. |
| Candidate data and profile | loadCandidateSnapshot and saveCandidateProfile use Redux Toolkit thunks. Fulfilled and rejected handlers update the snapshot, loading error, and profile sync data. Background refreshes preserve profile edits. Candidate commands cover apply, withdraw, save a drive, read notifications, find alumni, and request a referral. selectUnreadCandidateNotifications derives the unread count. |
| Recruiter data | loadRecruiterWorkspace handles pending, fulfilled, and rejected actions. Only the latest request may publish the snapshot. selectOpportunitiesWithCount derives applicant totals. |
| Admin platform | refreshPlatform and platformCommands preserve existing requests and write-then-refresh ordering. The College Admin and Super Admin reducers continue to handle platformLoaded, platformLoadStarted, platformLoadFailed, and platformLoadFinished. |
| Placement Officer | The existing shared refresh dispatches snapshotLoaded. Per-view readiness and failure markers are selected from Redux. Concurrent reads retain the existing request coalescing. |
| Login and session | signIn reads the login view and dispatches validation, loading, and message updates. The existing session persistence and redirect hydrate the auth slice on the next page. |
| Shared dialogs | dialogQueued and dialogDismissed maintain the queue. selectActiveDialog drives the existing native dialog and its confirmation promise. |

Other screen-specific requests retain their existing service calls and dispatch form, result, loading, and error updates to their Redux view records.

## Updated components and state inventory

Paths are relative to the React frontend. This table lists the fields declared by each migrated view or hook.

### Candidate

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/roles/candidate/components/Layout.jsx](src/roles/candidate/components/Layout.jsx) | Layout | isSignOutOpen |
| [src/roles/candidate/hooks/useToast.js](src/roles/candidate/hooks/useToast.js) | useToast | toast |
| [src/roles/candidate/pages/ApplicationTracker.jsx](src/roles/candidate/pages/ApplicationTracker.jsx) | ApplicationTracker | filter |
| [src/roles/candidate/pages/Applications.jsx](src/roles/candidate/pages/Applications.jsx) | GetReferralModal | alumni, selected, message, sending, error |
| [src/roles/candidate/pages/Applications.jsx](src/roles/candidate/pages/Applications.jsx) | Applications | filter, search, expandedId, referralAppId, notice |
| [src/roles/candidate/pages/Opportunities.jsx](src/roles/candidate/pages/Opportunities.jsx) | ApplicationContactStep | phone, linkedin |
| [src/roles/candidate/pages/Opportunities.jsx](src/roles/candidate/pages/Opportunities.jsx) | ApplicationQuestionsStep | workEligibility, experience, coverLetter |
| [src/roles/candidate/pages/Opportunities.jsx](src/roles/candidate/pages/Opportunities.jsx) | Opportunities | activeJobId, typeFilter, query, showAdvanced, advanced, applyError, eligibilityInfo, termsOpen, termsChecked, successOpen, pendingApplyJobId, applyStep, selectedResume, selectedResumeUrl |
| [src/roles/candidate/pages/Profile.jsx](src/roles/candidate/pages/Profile.jsx) | Profile | modal, recordType, imageOptionsTarget, confirmDelete, introForm, aboutText, skillInput, langForm, codingForm, recordForm |
| [src/roles/candidate/pages/Referrals.jsx](src/roles/candidate/pages/Referrals.jsx) | Referrals | tab |

### Alumni

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/roles/alumni/AlumniApp.jsx](src/roles/alumni/AlumniApp.jsx) | AlumniApp | isSignOutOpen |
| [src/roles/alumni/components/AlumniNotifications.jsx](src/roles/alumni/components/AlumniNotifications.jsx) | AlumniNotifications | notifications, isOpen |
| [src/roles/alumni/components/DeclineModal.jsx](src/roles/alumni/components/DeclineModal.jsx) | DeclineModal | reason, error |
| [src/roles/alumni/components/ResumeModal.jsx](src/roles/alumni/components/ResumeModal.jsx) | ResumeModal | documentUrl, fileType, error, loading |
| [src/roles/alumni/pages/AlumniDashboard.jsx](src/roles/alumni/pages/AlumniDashboard.jsx) | AlumniDashboard | isSignOutOpen, fadingCardId |
| [src/roles/alumni/pages/AlumniDirectory.jsx](src/roles/alumni/pages/AlumniDirectory.jsx) | AlumniDirectory | searchQuery, batch, dept, alumniList, loading, errorMessage, isSignOutOpen |
| [src/roles/alumni/pages/AlumniProfile.jsx](src/roles/alumni/pages/AlumniProfile.jsx) | AlumniProfile | isSignOutOpen, isChangePasswordOpen, isEditing, editFields, isEditingSocials, editSocials, newSkill, showAddSkill |
| [src/roles/alumni/pages/ReferralRequests.jsx](src/roles/alumni/pages/ReferralRequests.jsx) | ReferralRequests | currentFilter, searchQuery, openCards, replyMessages, resumeModalData, declineModalData, isSignOutOpen |

### Recruiter

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/roles/recruiter/RecruiterApp.jsx](src/roles/recruiter/RecruiterApp.jsx) | RecruiterApp | isSignOutOpen |
| [src/roles/recruiter/components/Applications.jsx](src/roles/recruiter/components/Applications.jsx) | Applications | searchTerm, filterReferred, statusFilter, selectedCandidateId |
| [src/roles/recruiter/components/Assessments.jsx](src/roles/recruiter/components/Assessments.jsx) | Assessments | showScheduleModal |
| [src/roles/recruiter/components/CandidateModal.jsx](src/roles/recruiter/components/CandidateModal.jsx) | CandidateModal | showResumePreview, resumeBlob, resumeError, saving, feedback, rating |
| [src/roles/recruiter/components/CandidatesFilter.jsx](src/roles/recruiter/components/CandidatesFilter.jsx) | CandidatesFilter | role, dept, minCgpa, referredOnly, searchTerm, selectedIds, viewingCandidateId |
| [src/roles/recruiter/components/MyOpportunities.jsx](src/roles/recruiter/components/MyOpportunities.jsx) | MyOpportunities | editingId |
| [src/roles/recruiter/components/Navbar.jsx](src/roles/recruiter/components/Navbar.jsx) | Navbar | showNotifs, showProfileMenu |
| [src/roles/recruiter/components/OpportunityEditor.jsx](src/roles/recruiter/components/OpportunityEditor.jsx) | OpportunityEditor | form, locations, amount, errors, saving |
| [src/roles/recruiter/components/OpportunityFields.jsx](src/roles/recruiter/components/OpportunityFields.jsx) | LocationAdder | cur, err |
| [src/roles/recruiter/components/OpportunityFields.jsx](src/roles/recruiter/components/OpportunityFields.jsx) | SkillAdder | cur, err |
| [src/roles/recruiter/components/PostOpportunity.jsx](src/roles/recruiter/components/PostOpportunity.jsx) | FullTimeForm | jobId, title, locations, ctcLpa, cgpa, deadline, description, selectedBranches, skills, errors |
| [src/roles/recruiter/components/PostOpportunity.jsx](src/roles/recruiter/components/PostOpportunity.jsx) | InternshipForm | jobId, title, locations, duration, compensation, cgpa, deadline, description, selectedBranches, skills, errors |
| [src/roles/recruiter/components/PostOpportunity.jsx](src/roles/recruiter/components/PostOpportunity.jsx) | PostOpportunity | jobType |
| [src/roles/recruiter/components/Profile.jsx](src/roles/recruiter/components/Profile.jsx) | Profile | passwordOpen, saving, isEditing, formData, errors |
| [src/roles/recruiter/components/ScheduleModal.jsx](src/roles/recruiter/components/ScheduleModal.jsx) | ScheduleModal | title, jobId, selectedIds, search, saving, date, time, duration, platform, type, link, errors |

### Placement Officer

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/roles/placement-officer/components/AppTracking.jsx](src/roles/placement-officer/components/AppTracking.jsx) | AppTracking | searchQuery, selectedCandidateId |
| [src/roles/placement-officer/components/BulkNotify.jsx](src/roles/placement-officer/components/BulkNotify.jsx) | BulkNotify | title, message, targetGroup, sending, successInfo, sendError, formErrors, history |
| [src/roles/placement-officer/components/CandidatesFilter.jsx](src/roles/placement-officer/components/CandidatesFilter.jsx) | CandidatesFilter | candidates, loadError, dept, minCgpa, maxBacklogs |
| [src/roles/placement-officer/components/Dashboard.jsx](src/roles/placement-officer/components/Dashboard.jsx) | Dashboard | alertDismissed |
| [src/roles/placement-officer/components/Header.jsx](src/roles/placement-officer/components/Header.jsx) | Header | officer, profileOpen, isSignOutOpen, notifOpen, searchQuery, searchResultsOpen, readIds |
| [src/roles/placement-officer/components/Profile.jsx](src/roles/placement-officer/components/Profile.jsx) | StyledInput | focused |
| [src/roles/placement-officer/components/Profile.jsx](src/roles/placement-officer/components/Profile.jsx) | StyledTextarea | focused |
| [src/roles/placement-officer/components/Profile.jsx](src/roles/placement-officer/components/Profile.jsx) | EditProfileModal | form, errors, touched |
| [src/roles/placement-officer/components/Profile.jsx](src/roles/placement-officer/components/Profile.jsx) | Profile | userData, editingSection, draft, isChangePasswordOpen |
| [src/roles/placement-officer/components/Recruiters.jsx](src/roles/placement-officer/components/Recruiters.jsx) | Recruiters | selectedRecruiterId, searchQuery, openProfileIdx, openVerifyIdx, openDeclineIdx, declineRemarks, declineError, credentials, copied |
| [src/roles/placement-officer/components/ReviewOpportunities.jsx](src/roles/placement-officer/components/ReviewOpportunities.jsx) | ReviewOpportunities | activeStatus, typeFilter, openCards, rejectModalOpen, rejectTarget, rejectRemarks, rejectError |
| [src/roles/placement-officer/components/Sidebar.jsx](src/roles/placement-officer/components/Sidebar.jsx) | Sidebar | isSignOutOpen |
| [src/roles/placement-officer/components/Statistics.jsx](src/roles/placement-officer/components/Statistics.jsx) | Statistics | showFullTime, showInternships, activeTab |
| [src/roles/placement-officer/services/officerApi.js](src/roles/placement-officer/services/officerApi.js) | useOfficerData | initialRevision, failedRevision |

### College Admin

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/roles/college-admin/CollegeAdminApp.jsx](src/roles/college-admin/CollegeAdminApp.jsx) | CollegeAdminApp | isSignOutOpen |
| [src/roles/college-admin/components/Topbar.jsx](src/roles/college-admin/components/Topbar.jsx) | CATopbar | dropdownOpen |
| [src/roles/college-admin/pages/ActivityLog.jsx](src/roles/college-admin/pages/ActivityLog.jsx) | ActivityLog | entries, loading, error, query |
| [src/roles/college-admin/pages/Announcements.jsx](src/roles/college-admin/pages/Announcements.jsx) | AddAnnouncementModal | form, error, saving |
| [src/roles/college-admin/pages/Announcements.jsx](src/roles/college-admin/pages/Announcements.jsx) | Announcements | announcements, loading, err, showAdd |
| [src/roles/college-admin/pages/Messages.jsx](src/roles/college-admin/pages/Messages.jsx) | Messages | messages, error |
| [src/roles/college-admin/pages/Officers.jsx](src/roles/college-admin/pages/Officers.jsx) | AddOfficerModal | form, error |
| [src/roles/college-admin/pages/Officers.jsx](src/roles/college-admin/pages/Officers.jsx) | Officers | showAdd, filter |
| [src/roles/college-admin/pages/Profile.jsx](src/roles/college-admin/pages/Profile.jsx) | Profile | profile, collegeInfo, loading, isEditing, editFields, saving, isChangePasswordOpen |
| [src/roles/college-admin/pages/Recruiters.jsx](src/roles/college-admin/pages/Recruiters.jsx) | Recruiters | recruiters, selectedId, error, loading, removingId |
| [src/roles/college-admin/pages/Students.jsx](src/roles/college-admin/pages/Students.jsx) | Students | query, deptFilter, yearFilter |

### Super Admin

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/roles/super-admin/SuperAdminApp.jsx](src/roles/super-admin/SuperAdminApp.jsx) | SuperAdminApp | isSignOutOpen |
| [src/roles/super-admin/components/Topbar.jsx](src/roles/super-admin/components/Topbar.jsx) | Topbar | dropdownOpen |
| [src/roles/super-admin/pages/ActivityLog.jsx](src/roles/super-admin/pages/ActivityLog.jsx) | ActivityLog | entries, loading, err, filter |
| [src/roles/super-admin/pages/CollegeAdmins.jsx](src/roles/super-admin/pages/CollegeAdmins.jsx) | AssignAdminModal | form, error |
| [src/roles/super-admin/pages/CollegeAdmins.jsx](src/roles/super-admin/pages/CollegeAdmins.jsx) | CollegeAdmins | assignTarget |
| [src/roles/super-admin/pages/Colleges.jsx](src/roles/super-admin/pages/Colleges.jsx) | AddCollegeModal | form, touched, error, saving |
| [src/roles/super-admin/pages/Colleges.jsx](src/roles/super-admin/pages/Colleges.jsx) | Colleges | showAdd, statusTarget |
| [src/roles/super-admin/pages/Messages.jsx](src/roles/super-admin/pages/Messages.jsx) | ComposeForm | toType, toId, subject, body, sending, formErr |
| [src/roles/super-admin/pages/Messages.jsx](src/roles/super-admin/pages/Messages.jsx) | Messages | messages, loading, err, toast |
| [src/roles/super-admin/pages/Profile.jsx](src/roles/super-admin/pages/Profile.jsx) | Profile | profile, loading, isEditing, fields, saving, isChangePasswordOpen |

### Shared components in the active role slice

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/shared/components/AccountCsvImport.jsx](src/shared/components/AccountCsvImport.jsx) | StudentCsvImport | csv, result, error, busy, filename |
| [src/shared/components/AccountDirectory.jsx](src/shared/components/AccountDirectory.jsx) | AccountDirectory | users, policy, loadError, loading, activeTab, search, branch, addOpen, csvOpen, form, saving, removingId, formError, fieldErrors, submitted |
| [src/shared/components/ChangePasswordModal.jsx](src/shared/components/ChangePasswordModal.jsx) | ChangePasswordModal | form, showPasswords, error, success, saving |
| [src/shared/components/RecruiterOpportunitiesModal.jsx](src/shared/components/RecruiterOpportunitiesModal.jsx) | RecruiterOpportunitiesModal | jobs, loading, error |

### Public and login pages

| File | View or hook | Redux fields |
| --- | --- | --- |
| [src/public-pages/landing/components/ContactSection.jsx](src/public-pages/landing/components/ContactSection.jsx) | ContactSection | form, colleges, touched, status |
| [src/public-pages/landing/components/FAQ.jsx](src/public-pages/landing/components/FAQ.jsx) | FAQ | activeIndex |
| [src/public-pages/landing/components/Features.jsx](src/public-pages/landing/components/Features.jsx) | Features | activeRole |
| [src/public-pages/landing/components/Footer.jsx](src/public-pages/landing/components/Footer.jsx) | Footer | email, subscribed |
| [src/public-pages/landing/components/Hero.jsx](src/public-pages/landing/components/Hero.jsx) | Hero | currentImage |
| [src/public-pages/landing/components/Navbar.jsx](src/public-pages/landing/components/Navbar.jsx) | Navbar | scrolled |
| [src/public-pages/landing/components/Stats.jsx](src/public-pages/landing/components/Stats.jsx) | Stats | started, values |
| [src/public-pages/login/LoginPage.jsx](src/public-pages/login/LoginPage.jsx) | LoginPage | email, password, showPassword, message, messageColor, loading |

The inventory contains 311 view fields. Other updated integration files are CandidateApp.jsx, candidate/context/StoreContext.jsx, candidate/context/UIContext.jsx, shared/context/PlatformDataContext.jsx, shared/components/AppDialog.jsx, and the College Admin Dashboard.jsx, where an unused React state import was removed.

## Final audit and verification

### Store and state ownership

- The audit parsed all 137 frontend JavaScript and JSX files. It found no useState, useReducer, createContext, useContext, or useSyncExternalStore calls in the application source. React Redux's root Provider connects the sole store to the app.
- All six role reducers own their workspace and view records. Public and authentication state and the dialog queue also use that store. Forms, search, filters, sorting, selections, loading, errors, and response data use selectors and Redux actions. The audit found no list pagination controls or pagination state to test. Workspace tab navigation and persistence were tested.
- The JSX audit found no uncontrolled editable fields, excluding native file pickers. Placement Officer's styled inputs forward controlled values supplied by their callers.
- Each mounted view has an independent key. Field updates for an unmounted view are dropped. Switching accounts clears role data and the dialog queue. Request-version checks discard workspace responses that belong to an earlier account.
- React refs hold DOM and chart objects, timer handles, the current navigation callback, and mounted checks. Browser storage backs session bootstrap and cross-tab sync, theme, last visited workspace tabs, and the inbox read timestamp. React Router owns URLs and history. The Placement Officer request cache holds an in-flight promise for deduplication. The browser dialog adapter manages promise resolution, focus, and DOM lifetime.
- Runtime checks inspected the entire populated Redux store in each role. Plain objects, arrays, primitives, and optional undefined fields passed with Redux Toolkit's serializability middleware active. File and Blob objects stay in the upload and URL creation handlers. Resume previews keep string URLs and metadata in Redux. The browser test opened a seeded PDF and verified that close revoked the URL and cleared the Redux preview data. Backend tests exercised upload and exact-file retrieval.

### Corrections made in the audit

- Account switches cancel visible and queued confirmations and resolve the old confirmation promises to false.
- Closing a password modal unmounts its form and releases the Redux draft. Closing an alumni resume modal clears the revoked preview URL and its metadata. Candidate application state now uses the existing resume metadata without a second unused upload field.
- The Super Admin phone validation change was removed from the migration. The save handler in the original ad38cf3 revision references an undefined editFields name before it can send a request. Repairing that pre-existing save failure is a separate change.

### Original behavior comparison

The source comparison matched all 108 statically identifiable API call sites by method, path pattern, and occurrence count between ad38cf3 and the migrated frontend. Reviewed login and workspace flows retain their endpoints, header construction, and payloads. Browser and backend tests exercised the representative workflows below against local demo data.

### Browser results

Every workspace passed sign-in, route render, authenticated API reads, form or filter interaction, and Redux serializability checks.

| Workspace | Additional verified behavior |
| --- | --- |
| Candidate | Job search and sort selection, profile skill add and delete with autosave, application contact draft and step reset |
| Alumni | Referral search, profile skill add and delete, password draft removal, PDF preview and blob URL cleanup |
| Recruiter | Opportunity create, edit, and delete, scheduling form input, draft reset after leaving the screen, active tab restored on reload |
| Placement Officer | Review status and type filters, approval and undo, statistics and notification screen input |
| College Admin | Account search, announcement validation, create and delete, cancelled confirmation, loading, failed request, retry, and draft cleanup |
| Super Admin | College form validation, create and deactivate, profile edit and cancel. Profile save has the baseline issue above. |

A real cross-tab sign-in cancelled the previous account's active and queued confirmations, cleared its view records, and redirected its role route. Separate checks covered independent view records, unmount cleanup, and signed-out route protection.

### Build and test results

- The production build and Git whitespace check passed. All 15 backend unit tests and 21 backend end-to-end tests passed.
- Standalone middleware verification passed the security header and missing-route checks. Its header-only requests then received 401 responses on routes that require a session. The script aborted during its upload cleanup, so its rate-limit step did not run.
- The frontend lint command is blocked by the missing ESLint configuration. Standalone undefined-name and Rules of Hooks checks across 137 files identified only the two references to the same baseline Super Admin variable.
- Browser checks covered the workflows listed above. Coverage does not extend to every validation branch and every possible API failure response.
- All changes remain uncommitted.
