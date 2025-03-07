import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('team_portal.db')
cursor = conn.cursor()

# Check services table
print("\n=== Services Table Contents ===")
cursor.execute("SELECT * FROM services")
services = cursor.fetchall()

if services:
    print(f"Found {len(services)} rows in services table")
    # Print column names
    cursor.execute("PRAGMA table_info(services)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"Columns: {columns}")
    
    # Print all rows
    print("\nAll service rows:")
    for service in services:
        print(service)
else:
    print("No data found in services table")

# Query to check the squad_members table
print("\n=== Squad Members Table Contents ===")
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

# Check squads table
print("\n=== Squads Table ===")
cursor.execute("SELECT id, name FROM squads")
squads = cursor.fetchall()
if squads:
    print(f"Found {len(squads)} squads:")
    for squad in squads:
        print(f"Squad ID: {squad[0]}, Name: {squad[1]}")
        
        # Check services for this squad
        cursor.execute(f"SELECT id, name, status, service_type FROM services WHERE squad_id = {squad[0]}")
        squad_services = cursor.fetchall()
        if squad_services:
            print(f"  - Services ({len(squad_services)}):")
            for service in squad_services:
                print(f"    - ID: {service[0]}, Name: {service[1]}, Status: {service[2]}, Type: {service[3]}")
        else:
            print("  - No services for this squad")
else:
    print("No squads found")

# Close the connection
conn.close()
