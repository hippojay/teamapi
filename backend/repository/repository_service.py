from typing import List, Dict, Any, Optional
import logging
from .gitlab_client import GitLabClient
from sqlalchemy.orm import Session
import models
import user_crud

logger = logging.getLogger(__name__)

class RepositoryService:
    """Service for interacting with repository platforms"""
    
    def __init__(self, db: Session):
        self.db = db
        self.gitlab_client = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize repository clients based on admin settings"""
        # Get GitLab settings
        gitlab_url = user_crud.get_admin_setting_value(self.db, "gitlab_api_url")
        gitlab_token = user_crud.get_admin_setting_value(self.db, "gitlab_api_token")
        
        if gitlab_url and gitlab_token:
            try:
                self.gitlab_client = GitLabClient(gitlab_url, gitlab_token)
                logger.info(f"GitLab client initialized with URL: {gitlab_url}")
            except Exception as e:
                logger.error(f"Failed to initialize GitLab client: {str(e)}")
        else:
            logger.warning("GitLab client not initialized - missing configuration")
    
    def search_repositories(self, search_term: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search for repositories across all configured providers
        Returns a list of repositories with their details
        """
        results = []
        
        # Search GitLab repositories
        if self.gitlab_client:
            gitlab_results = self.gitlab_client.search_repositories(search_term, limit)
            results.extend(gitlab_results)
        
        # Sort results by name
        results.sort(key=lambda x: x.get("name", "").lower())
        
        return results
    
    def get_repository_details(self, repository_id: int, source: str) -> Optional[Dict[str, Any]]:
        """
        Get details of a specific repository by ID and source
        Returns repository details or None if not found
        """
        if source == "gitlab" and self.gitlab_client:
            return self.gitlab_client.get_repository_details(repository_id)
        
        return None
    
    def get_group_projects(self, group_id: int, source: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all projects (repositories) in a group
        Returns a list of repositories with their details
        """
        if source == "gitlab" and self.gitlab_client:
            return self.gitlab_client.get_group_projects(group_id, limit)
        
        return []
