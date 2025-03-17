/**
 * Authorization utility functions to check if a user has permissions
 * to edit specific resources.
 */

import { isAdmin, isTeamMember } from './roleUtils';

/**
 * Check if the user is authorized to edit a squad
 * A user can edit a squad if they are an admin or a member of that squad
 * 
 * @param {Object} user - The current user object
 * @param {Object} squad - The squad object
 * @returns {boolean} - True if the user is authorized to edit
 */
export const canEditSquad = (user, squad) => {
  // Admins can edit any squad
  if (isAdmin(user)) {
    return true;
  }
  
  // Check if the user is a team member
  if (!isTeamMember(user)) {
    return false;
  }
  
  // Check if the user has email
  if (!user.email) {
    return false;
  }
  
  // If squad has no team members, they can't edit
  if (!squad || !squad.team_members || !Array.isArray(squad.team_members)) {
    return false;
  }
  
  // Check if the user is a member of this squad by matching email
  return squad.team_members.some(member => 
    member.email && member.email.toLowerCase() === user.email.toLowerCase()
  );
};

/**
 * Check if the user is authorized to edit dependencies for a squad
 * @param {Object} user - The current user object
 * @param {Object} squad - The squad object
 * @returns {boolean} - True if the user is authorized to edit dependencies
 */
export const canEditDependencies = (user, squad) => {
  return canEditSquad(user, squad);
};

/**
 * Check if the user is authorized to edit services for a squad
 * @param {Object} user - The current user object
 * @param {Object} squad - The squad object
 * @returns {boolean} - True if the user is authorized to edit services
 */
export const canEditServices = (user, squad) => {
  return canEditSquad(user, squad);
};

/**
 * Check if the user is authorized to edit the description of an entity
 * For squads, the user must be a member of the squad or an admin
 * For other entity types (area, tribe), only admins can edit
 * 
 * @param {Object} user - The current user object
 * @param {string} entityType - The type of entity (area, tribe, squad)
 * @param {Object} entity - The entity object
 * @returns {boolean} - True if the user is authorized to edit the description
 */
export const canEditDescription = (user, entityType, entity) => {
  // Admins can edit any description
  if (isAdmin(user)) {
    return true;
  }
  
  // For squads, team members can edit if they're in the squad
  if (entityType === 'squad' && isTeamMember(user)) {
    return canEditSquad(user, entity);
  }
  
  // For other entity types, only admins can edit
  return false;
};
