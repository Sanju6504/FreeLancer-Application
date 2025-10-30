/**
 * Shared runtime-agnostic typedefs for editor intellisense.
 * Converted from types.ts to plain JS with JSDoc.
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} fullName
 * @property {string} [location]
 * @property {number} [activeProjects]
 * @property {number} [pendingApplications]
 * @property {number} [completedProjects]
 * @property {number} [totalRating] - out of 5
 * @property {string} [title]
 * @property {number} [hourlyRate]
 * @property {string} [bio]
 * @property {string} [website]
 * @property {string} [linkedin]
 * @property {string} [github]
 * @property {string} [responseTime]
 * @property {'freelancer'|'employer'} [role]
 */

/**
 * @typedef {Object} UserWithProfile
 * @property {string} id
 * @property {Profile} profile
 */

/**
 * @typedef {'fixed' | 'hourly'} JobBudgetType
 */

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} employerId
 * @property {string} title
 * @property {string} [description]
 * @property {JobBudgetType} [budgetType]
 * @property {number} [budgetMin]
 * @property {number} [budgetMax]
 * @property {string} [createdAt]
 * @property {string} [location]
 * @property {'entry'|'intermediate'|'expert'} [experienceLevel]
 * @property {number} [applicationsCount]
 */

/**
 * @typedef {'pending' | 'accepted' | 'rejected' | 'withdrawn'} ApplicationStatus
 */

/**
 * @typedef {Object} Application
 * @property {string} id
 * @property {string} jobId
 * @property {string} freelancerId
 * @property {ApplicationStatus} status
 * @property {string} [coverLetter]
 * @property {number} [proposedRate]
 * @property {number} [estimatedDuration] - days
 * @property {string} createdAt
 */

// No runtime exports needed; these typedefs are for tooling support only.
