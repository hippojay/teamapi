from setuptools import setup, find_packages

setup(
    name="whowhatwhere",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "numpy",
        "pandas",
        "openpyxl",
        "pydantic",
        "python-multipart",
        "xlrd",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "email-validator",
    ],
)
