import requests
import json
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class GitLabClient:
    """Client for interacting with the GitLab API"""
    
    def __init__(self, api_url: str, token: str):
        self.api_url = api_url.rstrip("/")  # Remove trailing slashes
        self.token = token
        self.headers = {
            "PRIVATE-TOKEN": token,
            "Content-Type": "application/json"
        }
    
    def search_repositories(self, search_term: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search for repositories in GitLab using the provided search term
        Returns a list of repositories with their details
        """
        if len(search_term) < 3:
            logger.warning(f"Search term is too short: {search_term}")
            return []
            
        try:
            # First, search for projects
            projects_url = f"{self.api_url}/api/v4/projects"
            params = {
                "search": search_term,
                "order_by": "name",
                "sort": "asc",
                "per_page": limit,
                "simple": True  # Return simple project data (faster)
            }
            
            response = requests.get(projects_url, headers=self.headers, params=params)
            response.raise_for_status()
            
            projects = response.json()
            
            # Format repositories with type flag
            formatted_repos = []
            for project in projects:
                formatted_repos.append({
                    "id": project["id"],
                    "name": project["name"],
                    "path": project.get("path_with_namespace", ""),
                    "description": project.get("description", ""),
                    "type": "repository",
                    "url": project.get("web_url", ""),
                    "avatar_url": project.get("avatar_url", ""),
                    "source": "gitlab",
                    "updated_at": project.get("last_activity_at", "")
                })
            
            # Next, search for groups 
            groups_url = f"{self.api_url}/api/v4/groups"
            params = {
                "search": search_term,
                "order_by": "name",
                "sort": "asc",
                "per_page": limit
            }
            
            response = requests.get(groups_url, headers=self.headers, params=params)
            response.raise_for_status()
            
            groups = response.json()
            
            # Format groups with type flag
            for group in groups:
                formatted_repos.append({
                    "id": group["id"],
                    "name": group["name"],
                    "path": group.get("full_path", ""),
                    "description": group.get("description", ""),
                    "type": "group",
                    "url": group.get("web_url", ""),
                    "avatar_url": group.get("avatar_url", ""),
                    "source": "gitlab",
                    "updated_at": group.get("created_at", "")
                })
            
            return formatted_repos
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching GitLab repositories: {str(e)}")
            return []
    
    def get_repository_details(self, repository_id: int) -> Optional[Dict[str, Any]]:
        """
        Get details of a specific repository by ID
        Returns repository details or None if not found
        """
        try:
            url = f"{self.api_url}/api/v4/projects/{repository_id}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            project = response.json()
            
            return {
                "id": project["id"],
                "name": project["name"],
                "description": project.get("description", ""),
                "url": project.get("web_url", ""),
                "default_branch": project.get("default_branch", "main"),
                "created_at": project.get("created_at", ""),
                "updated_at": project.get("last_activity_at", ""),
                "type": "REPO",
                "source": "gitlab"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting repository details: {str(e)}")
            return None
    
    def get_group_projects(self, group_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all projects (repositories) in a group
        Returns a list of repositories with their details
        """
        try:
            url = f"{self.api_url}/api/v4/groups/{group_id}/projects"
            params = {
                "per_page": limit,
                "simple": True
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            projects = response.json()
            
            formatted_repos = []
            for project in projects:
                formatted_repos.append({
                    "id": project["id"],
                    "name": project["name"],
                    "path": project.get("path_with_namespace", ""),
                    "description": project.get("description", ""),
                    "type": "repository",
                    "url": project.get("web_url", ""),
                    "avatar_url": project.get("avatar_url", ""),
                    "source": "gitlab",
                    "updated_at": project.get("last_activity_at", "")
                })
                
            return formatted_repos
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting group projects: {str(e)}")
            return []
