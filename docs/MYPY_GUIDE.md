# MyPy Type Checking Guide for Who What Where

This guide provides instructions for using MyPy for static type checking in the Who What Where portal.

## Introduction

[MyPy](https://mypy.readthedocs.io/) is a static type checker for Python that helps catch type-related errors early in the development process. By adding type annotations to our Python code, we can:

- Catch errors before runtime
- Improve code readability and self-documentation
- Enable better IDE support (autocompletion, refactoring)
- Facilitate safer code changes and refactoring

## Setup

### Installation

MyPy is already included in the project's development dependencies. You can also install it locally:

```bash
pip install mypy types-sqlalchemy
```

### Configuration

A MyPy configuration file is located at `/home/dave/who/backend/mypy.ini`. This file defines how strict the type checking should be for different parts of the codebase.

Key configuration options:

```ini
[mypy]
python_version = 3.10
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = False  # This is False globally but True for specific modules
disallow_incomplete_defs = False
check_untyped_defs = True
disallow_untyped_decorators = False
no_implicit_optional = True
strict_optional = True

# Per-module options:
[mypy.models.*]
disallow_untyped_defs = True  # More strict typing for models
disallow_incomplete_defs = True

[mypy.schemas.*]
disallow_untyped_defs = True  # More strict typing for schemas
disallow_incomplete_defs = True
```

## Adding Type Annotations

### Basic Types

Add type annotations to function arguments, return values, and variables:

```python
def get_area(db: Session, area_id: int) -> Optional[models.Area]:
    return db.query(models.Area).filter(models.Area.id == area_id).first()
```

### SQLAlchemy Model Types

For SQLAlchemy models, use the `Mapped` type from SQLAlchemy:

```python
from sqlalchemy.orm import Mapped

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    username: Mapped[Optional[str]] = Column(String, unique=True, index=True, nullable=True)
    email: Mapped[str] = Column(String, unique=True, index=True)
```

See `models_typed_example.py` for more examples.

### Pydantic Schema Types

For Pydantic schemas, types are already specified directly in the field definitions:

```python
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
```

### FastAPI Route Types

For FastAPI routes, the annotations should focus on function parameters and return types:

```python
@app.get("/areas/{area_id}", response_model=schemas.AreaDetail)
def get_area(area_id: int, db: Session = Depends(get_db)) -> schemas.AreaDetail:
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return area
```

## Running MyPy

### Command Line

To run MyPy locally:

```bash
cd backend
mypy --config-file mypy.ini models schemas main.py
```

### CI Pipeline

MyPy is configured to run automatically as part of our CI pipeline. Check the GitHub Actions workflows for details.

## Type Checking Strategy

We follow a pragmatic approach to type checking:

1. **Models and Schemas**: Strong typing (disallow_untyped_defs=True)
2. **Routes and Utilities**: Moderate typing (check_untyped_defs=True)
3. **Tests**: Relaxed typing (ignore_errors=True)

## Common Type Annotations

- `Optional[Type]`: For nullable values
- `List[Type]`: For lists
- `Dict[KeyType, ValueType]`: For dictionaries
- `Union[Type1, Type2]`: For values that could be multiple types
- `Any`: For values where type checking should be skipped

## Handling Dependencies

For third-party libraries without type stubs, we've included types-sqlalchemy in our requirements. For other missing types, you can:

1. Install type stubs (e.g., `pip install types-package-name`)
2. Use `# type: ignore` comments (sparingly)
3. Create custom stub files

## Incremental Adoption

We're adopting typing incrementally:

1. First focus on models.py and schemas.py
2. Then add types to core business logic (crud.py, etc.)
3. Finally add types to route handlers in main.py

## References

- [MyPy Documentation](https://mypy.readthedocs.io/)
- [Type hints cheat sheet](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html)
- [SQLAlchemy 2.0 typing guide](https://docs.sqlalchemy.org/en/20/orm/extensions/mypy.html)
