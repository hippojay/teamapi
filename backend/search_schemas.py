from pydantic import BaseModel
from typing import List, Optional

class SearchResultItem(BaseModel):
    id: int
    name: str
    type: str  # 'area', 'tribe', 'squad', 'person', 'service'
    description: Optional[str] = None
    parent_name: Optional[str] = None  # For context (e.g., squad's tribe)
    url: str  # Frontend URL to navigate to
    
    class Config:
        orm_mode = True

class SearchResults(BaseModel):
    results: List[SearchResultItem] = []
    total: int
