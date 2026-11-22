const EMPTY_RESUME = {
    uploadedResume: null,
    resumeHistory: [],
    skills: [],
    languages: [],
    codingProfiles: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    extracurricular: [],
    additionalDocs: [],
};

const initials = (name = '') => name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

function toCurrentUser(user, resumeData = {}) {
    return {
        id: user.id,
        name: user.name || '',
        headline: user.headline || '',
        role: 'Student',
        avatar: user.avatar || initials(user.name),
        avatarImage: resumeData.avatarImage || '',
        bannerImage: resumeData.bannerImage || '',
        department: user.department || '',
        cgpa: user.cgpa != null ? String(user.cgpa) : '',
        backlogs: user.backlogs ?? 0,
        rollNumber: user.rollNumber || '',
        collegeId: user.collegeId ?? null,
        batch: user.batchLabel || '',
        location: user.location || '',
        university: user.university || '',
        email: user.email || '',
        phone: user.phone || '',
        status: user.status || 'active',
        about: user.about || '',
        socialLinks: { github: '', linkedin: '', portfolio: '', ...(user.socialLinks || {}) },
    };
}

const toAnnouncement = (a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    date: new Date(a.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    priority: a.type === 'urgent' ? 'high' : a.type === 'placement' ? 'medium' : 'low',
});

export function buildStore({ user, jobs, applications, notifications, savedIds, schedule, referrals, announcements }) {
    const isPlaced = user.status === 'placed' || applications.some((application) => ['Offer', 'Offered'].includes(application.status));
    const savedProfile = user.resumeData?.profileResumeData || {};
    // Older accounts store skills directly on the user. Once a candidate edits
    // their profile, resumeData becomes the source of truth (even for an
    // intentionally empty skills list).
    const hasSavedSkills = Object.prototype.hasOwnProperty.call(savedProfile, 'skills');
    const appByOpp = new Map(applications.map((a) => [a.opportunityId, a]));
    const recruiterJobs = jobs.map((job) => {
        const app = appByOpp.get(job.id);
        const active = app && app.status !== 'Withdrawn';
        return { ...job, appliedStatus: active ? app.status : null };
    });
    const count = (statuses) => applications.filter((a) => statuses.includes(a.status)).length;
    const today = new Date().toISOString().split('T')[0];
    const upcoming = schedule
        .filter((s) => s.date >= today)
        .map((s) => ({
            id: `schedule-${s.id}`,
            appId: s.applicationId ?? applications.find(
              (a) => a.opportunityId === s.opportunityId
            )?.id,
            title: s.title,
            company: s.company,
            role: s.jobTitle,
            date: s.date,
            time: s.time,
            type: 'Interview',
            link: s.link,
        }));
    return {
        currentUser: toCurrentUser({ ...user, status: isPlaced ? 'placed' : user.status }, user.resumeData),
        profileResumeData: {
            ...EMPTY_RESUME,
            ...savedProfile,
            skills: hasSavedSkills ? savedProfile.skills : (user.skills || []),
        },
        dashboardStats: {
            applications: applications.length,
            availableJobs: jobs.filter((j) => /full/i.test(j.type)).length,
            internships: jobs.filter((j) => /intern/i.test(j.type)).length,
            interviews: count(['Interview']),
        },
        recruiterJobs,
        myApplications: applications,
        applicationStats: {
            shortlisted: count(['Shortlisted']),
            interviews: count(['Interview']),
            offers: count(['Offer', 'Offered']),
            rejected: count(['Rejected']),
        },
        notificationsData: notifications,
        announcementsData: announcements.map(toAnnouncement),
        upcomingEvents: upcoming,
        savedDriveIds: savedIds,
        schedule,
        referralRequests: referrals,
    };
}

export function emptyStore(session = {}) {
    return buildStore({
        user: session, jobs: [], applications: [], notifications: [], savedIds: [], schedule: [], referrals: [], announcements: [],
    });
}

export function profilePayload(store) {
    const u = store.currentUser;
    return {
        name: u.name,
        email: u.email,
        headline: u.headline,
        location: u.location,
        university: u.university,
        phone: u.phone,
        about: u.about,
        batchLabel: u.batch,
        socialLinks: u.socialLinks,
        resumeData: {
            avatarImage: u.avatarImage,
            bannerImage: u.bannerImage,
            profileResumeData: store.profileResumeData,
        },
    };
}
