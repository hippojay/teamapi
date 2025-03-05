import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('team_portal.db')
cursor = conn.cursor()

# Query to check the squad_members table
print("=== Squad Members Table Contents ===")
cursor.execute("SELECT * FROM squad_members")
rows = cursor.fetchall()

if rows:
    print(f"Found {len(rows)} rows in squad_members table")
    # Print column names
    cursor.execute("PRAGMA table_info(squad_members)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"Columns: {columns}")
    
    # Print first 5 rows
    print("\nFirst 5 rows:")
    for row in rows[:5]:
        print(row)
else:
    print("No data found in squad_members table")

# Check if any capacities are not 1.0 (the default)
print("\n=== Checking for non-default capacities ===")
cursor.execute("SELECT * FROM squad_members WHERE capacity != 1.0")
non_default_capacities = cursor.fetchall()

if non_default_capacities:
    print(f"Found {len(non_default_capacities)} entries with non-default capacities:")
    for row in non_default_capacities[:5]:
        print(row)
else:
    print("All capacities are set to the default value (1.0)")

# Get team members
print("\n=== Team Members ===")
cursor.execute("SELECT COUNT(*) FROM team_members")
member_count = cursor.fetchone()[0]
print(f"Total team members: {member_count}")

# Close the connection
conn.close()
